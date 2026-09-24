import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://127.0.0.1:5000/api';
const SECRET = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';

async function runTest() {
  console.log('--- STARTING FIELDS CONFIG & DYNAMIC ATTRIBUTES TEST ---');

  await mongoose.connect('mongodb://127.0.0.1:27017/myfolio');

  const user = await mongoose.connection.db.collection('users').findOne({});
  if (!user) {
    throw new Error('No user found in database');
  }

  const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1h' });
  console.log('Using user:', user.email);

  // 1. Create a book with custom fieldsConfig (no image, no price, has location, date, rating, url, custom field)
  const fieldsConfigPayload = {
    hasImage: false,
    hasPrice: false,
    hasLocation: true,
    hasDate: true,
    hasRating: true,
    hasUrl: true,
    hasDescription: true,
    customFields: [{ name: 'Editeur', type: 'text' }],
  };

  const createBookRes = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Livre Test Champs Personnalisés',
      description: 'Test des champs dynamiques',
      coverImage: 'cover-classic.svg',
      colorTheme: '#8b5cf6',
      isFavorite: true,
      fieldsConfig: fieldsConfigPayload,
    }),
  });

  if (!createBookRes.ok) {
    throw new Error(`Failed to create book: ${await createBookRes.text()}`);
  }

  const createdBook = await createBookRes.json();
  console.log('✓ Book created with fieldsConfig:', createdBook.title, createdBook.fieldsConfig);

  if (createdBook.fieldsConfig?.hasImage !== false || createdBook.fieldsConfig?.hasLocation !== true) {
    throw new Error('fieldsConfig was not saved properly on the book');
  }

  // 2. Create a product in this book with dynamic fields
  const createProductRes = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Premier Élément Test',
      description: 'Un super livre de test',
      location: 'Bibliothèque Salon, Rayon 2',
      date: '2026-09-24',
      rating: 5,
      url: 'https://example.com/livre-test',
      customValues: { Editeur: 'Gallimard' },
      bookId: createdBook._id,
    }),
  });

  if (!createProductRes.ok) {
    throw new Error(`Failed to create product: ${await createProductRes.text()}`);
  }

  const createdProduct = await createProductRes.json();
  console.log('✓ Product created with attributes:');
  console.log('  - location:', createdProduct.location);
  console.log('  - date:', createdProduct.date);
  console.log('  - rating:', createdProduct.rating);
  console.log('  - url:', createdProduct.url);
  console.log('  - customValues:', createdProduct.customValues);

  if (
    createdProduct.location !== 'Bibliothèque Salon, Rayon 2' ||
    createdProduct.rating !== 5 ||
    createdProduct.customValues?.Editeur !== 'Gallimard'
  ) {
    throw new Error('Product dynamic fields were not stored correctly');
  }

  // 3. Update the product
  const updateProductRes = await fetch(`${API_BASE}/products/${createdProduct._id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rating: 4,
      location: 'Étagère Bureau',
      customValues: { Editeur: 'Flammarion' },
    }),
  });

  if (!updateProductRes.ok) {
    throw new Error(`Failed to update product: ${await updateProductRes.text()}`);
  }

  const updatedProduct = await updateProductRes.json();
  console.log('✓ Product updated:');
  console.log('  - location:', updatedProduct.location);
  console.log('  - rating:', updatedProduct.rating);
  console.log('  - customValues:', updatedProduct.customValues);

  if (
    updatedProduct.location !== 'Étagère Bureau' ||
    updatedProduct.rating !== 4 ||
    updatedProduct.customValues?.Editeur !== 'Flammarion'
  ) {
    throw new Error('Product update for dynamic fields failed');
  }

  // 4. Update the book fieldsConfig
  const updateBookRes = await fetch(`${API_BASE}/books/${createdBook._id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fieldsConfig: {
        ...fieldsConfigPayload,
        hasImage: true,
        customFields: [
          { name: 'Editeur', type: 'text' },
          { name: 'Pages', type: 'number' },
        ],
      },
    }),
  });

  if (!updateBookRes.ok) {
    throw new Error(`Failed to update book fieldsConfig: ${await updateBookRes.text()}`);
  }

  const updatedBook = await updateBookRes.json();
  console.log('✓ Book fieldsConfig updated: hasImage =', updatedBook.fieldsConfig.hasImage, 'customFields count =', updatedBook.fieldsConfig.customFields.length);

  // 5. Cleanup test data
  await fetch(`${API_BASE}/books/${createdBook._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('✓ Test book and cascaded products cleaned up.');

  await mongoose.disconnect();
  console.log('--- ALL FIELDS CONFIG & DYNAMIC ATTRIBUTES TESTS PASSED SUCCESSFULLY! ---');
}

runTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
