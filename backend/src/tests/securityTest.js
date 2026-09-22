import assert from 'assert';
import http from 'http';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Label from '../models/Label.js';
import Product from '../models/Product.js';

// Configuration du mode test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_security_suite_2026';

const { app } = await import('../server.js');

async function runSecurityTests() {
  console.log('=== TEST DE SÉCURITÉ DE MYFOLIO ===\n');

  await connectDB();

  // Nettoyage préalable
  await User.deleteMany({ email: { $in: ['user1@sec.test', 'user2@sec.test'] } });

  // Démarrage du serveur sur un port éphémère (0)
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✓ Serveur de test démarré sur ${baseUrl}\n`);

  try {
    // ------------------------------------------------------------------------
    // 1. VÉRIFICATION DES EN-TÊTES DE SÉCURITÉ (HELMET)
    // ------------------------------------------------------------------------
    console.log('--- 1. En-têtes HTTP de sécurité (Helmet) ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const headers = healthRes.headers;
    assert(headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff doit être présent');
    assert(headers.get('x-frame-options') === 'SAMEORIGIN', 'X-Frame-Options doit être activé contre le clickjacking');
    assert(headers.get('content-security-policy') !== null, 'Content-Security-Policy doit être défini');
    console.log('✓ En-têtes Helmet (nosniff, X-Frame-Options, CSP) bien présents et actifs');

    // ------------------------------------------------------------------------
    // 2. VÉRIFICATION DU BLOCAGE DES REQUÊTES NON AUTHENTIFIÉES (401)
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Blocage des accès non authentifiés (401) ---');
    const unauthBooksRes = await fetch(`${baseUrl}/api/books`);
    assert.strictEqual(unauthBooksRes.status, 401, 'GET /api/books sans token doit retourner 401');

    const unauthCreateBookRes = await fetch(`${baseUrl}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Livre pirate' }),
    });
    assert.strictEqual(unauthCreateBookRes.status, 401, 'POST /api/books sans token doit retourner 401');

    const unauthLabelsRes = await fetch(`${baseUrl}/api/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Tag pirate', bookId: '6ab2e0ad85b084af851a3cd3' }),
    });
    assert.strictEqual(unauthLabelsRes.status, 401, 'POST /api/labels sans token doit retourner 401');

    const unauthProductsRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Produit pirate', bookId: '6ab2e0ad85b084af851a3cd3' }),
    });
    assert.strictEqual(unauthProductsRes.status, 401, 'POST /api/products sans token doit retourner 401');
    console.log('✓ Toutes les routes privées rejettent strictement les requêtes sans token (401)');

    // ------------------------------------------------------------------------
    // 3. INSCRIPTION DE DEUX UTILISATEURS POUR TEST MULTI-TENANT
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Inscription de 2 utilisateurs distincts ---');
    const regUser1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Utilisateur 1',
        email: 'user1@sec.test',
        password: 'Password123!',
        termsAccepted: true,
      }),
    });
    assert.strictEqual(regUser1.status, 201);
    const data1 = await regUser1.json();
    const token1 = data1.token;

    const regUser2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Utilisateur 2',
        email: 'user2@sec.test',
        password: 'Password123!',
        termsAccepted: true,
      }),
    });
    assert.strictEqual(regUser2.status, 201);
    const data2 = await regUser2.json();
    const token2 = data2.token;
    console.log('✓ Utilisateur 1 et Utilisateur 2 enregistrés avec succès');

    // ------------------------------------------------------------------------
    // 4. ISOLATION DES DONNÉES ET PROTECTION CONTRE LES ATTAQUES IDOR
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Vérification de l\'isolation stricte des données (Anti-IDOR) ---');
    // Utilisateur 1 crée un livre confidentiel
    const createBookRes = await fetch(`${baseUrl}/api/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        title: 'Collection Secrète User 1',
        description: 'Données privées',
      }),
    });
    assert.strictEqual(createBookRes.status, 201);
    const book1 = await createBookRes.json();
    console.log(`✓ Utilisateur 1 a créé son livre [${book1._id}]`);

    // Utilisateur 2 consulte la liste de ses livres : le livre de User 1 ne doit PAS apparaître
    const user2BooksRes = await fetch(`${baseUrl}/api/books`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert.strictEqual(user2BooksRes.status, 200);
    const user2Books = await user2BooksRes.json();
    assert(
      !user2Books.some((b) => b._id === book1._id),
      "L'utilisateur 2 ne doit pas voir les livres de l'utilisateur 1 dans sa liste"
    );
    console.log("✓ L'utilisateur 2 ne voit pas le livre de l'utilisateur 1 dans sa liste");

    // Utilisateur 2 tente d'accéder directement au livre de User 1 via son ID
    const user2AccessBook1 = await fetch(`${baseUrl}/api/books/${book1._id}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert.strictEqual(user2AccessBook1.status, 404, "L'accès direct par ID à un livre d'un tiers doit retourner 404");
    console.log("✓ Tentative d'accès IDOR par ID bloquée (404)");

    // Utilisateur 2 tente de modifier le livre de User 1
    const user2UpdateBook1 = await fetch(`${baseUrl}/api/books/${book1._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ title: 'Piraté par User 2' }),
    });
    assert.strictEqual(user2UpdateBook1.status, 404, 'La modification du livre d\'un tiers doit échouer');
    console.log("✓ Tentative de modification illégitime bloquée (404)");

    // Utilisateur 2 tente d'injecter un label dans le livre de User 1
    const user2AddLabel = await fetch(`${baseUrl}/api/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        name: 'Label intrus',
        color: '#ff0000',
        bookId: book1._id,
      }),
    });
    assert(
      user2AddLabel.status === 404 || user2AddLabel.status === 403,
      'L\'ajout d\'un label sur le livre d\'un tiers doit être refusé'
    );
    console.log("✓ Tentative d'injection de label sur le livre d'un tiers bloquée");

    // Utilisateur 2 tente de supprimer le livre de User 1
    const user2DeleteBook1 = await fetch(`${baseUrl}/api/books/${book1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert.strictEqual(user2DeleteBook1.status, 404, 'La suppression du livre d\'un tiers doit échouer');
    console.log("✓ Tentative de suppression illégitime bloquée (404)");

    // Utilisateur 1 supprime son propre livre
    const user1DeleteBook1 = await fetch(`${baseUrl}/api/books/${book1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert.strictEqual(user1DeleteBook1.status, 200);
    console.log('✓ Utilisateur 1 peut supprimer son propre livre');

    // ------------------------------------------------------------------------
    // 5. SÉCURISATION DU TÉLÉVERSEMENT DE FICHIERS (MULTER)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Sécurisation des téléversements (Multer) ---');
    // Tentative d'upload d'un script ou SVG
    const fakeSvgBoundary = '---------------------------974767299852498929531610575';
    const fakeSvgBody =
      `--${fakeSvgBoundary}\r\n` +
      `Content-Disposition: form-data; name="image"; filename="exploit.svg"\r\n` +
      `Content-Type: image/svg+xml\r\n\r\n` +
      `<svg><script>alert("XSS")</script></svg>\r\n` +
      `--${fakeSvgBoundary}--\r\n`;

    const uploadSvgRes = await fetch(`${baseUrl}/api/products/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': `multipart/form-data; boundary=${fakeSvgBoundary}`,
      },
      body: fakeSvgBody,
    });
    assert.strictEqual(uploadSvgRes.status, 400, 'L\'upload de SVG doit être rejeté');
    const uploadSvgErr = await uploadSvgRes.json();
    console.log(`✓ Rejet de fichier SVG malveillant confirmé : "${uploadSvgErr.message}"`);

    // Upload d'une image PNG valide (1x1 pixel PNG transparent)
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    const validPngBoundary = '---------------------------974767299852498929531610576';
    const validPngBody = Buffer.concat([
      Buffer.from(
        `--${validPngBoundary}\r\n` +
          `Content-Disposition: form-data; name="image"; filename="test-pixel.png"\r\n` +
          `Content-Type: image/png\r\n\r\n`
      ),
      validPngBuffer,
      Buffer.from(`\r\n--${validPngBoundary}--\r\n`),
    ]);

    const uploadPngRes = await fetch(`${baseUrl}/api/products/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': `multipart/form-data; boundary=${validPngBoundary}`,
      },
      body: validPngBody,
    });
    assert.strictEqual(uploadPngRes.status, 200, 'L\'upload d\'un PNG valide doit réussir');
    const uploadPngData = await uploadPngRes.json();
    assert(uploadPngData.url && uploadPngData.url.startsWith('/uploads/prod-'), 'L\'URL doit pointer vers /uploads/prod-');
    console.log(`✓ Upload valide accepté : ${uploadPngData.url}`);

    console.log('\n======================================================');
    console.log('🎉 TOUS LES TESTS DE SÉCURITÉ ONT RÉUSSI AVEC SUCCÈS !');
    console.log('======================================================\n');
  } finally {
    // Nettoyage final
    await User.deleteMany({ email: { $in: ['user1@sec.test', 'user2@sec.test'] } });
    await new Promise((resolve) => server.close(resolve));
    await closeDB();
  }
}

runSecurityTests().catch((err) => {
  console.error('\n❌ Échec du test de sécurité :', err);
  process.exit(1);
});
