import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://127.0.0.1:5000/api';
const SECRET = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';

async function runSharingTest() {
  console.log('--- STARTING BOOK SHARING & PERMISSIONS TEST ---');

  await mongoose.connect('mongodb://127.0.0.1:27017/myfolio');

  const alexHuangUser = await mongoose.connection.db.collection('users').findOne({ email: 'alex.huang@edu.ece.fr' });
  const alexUser = await mongoose.connection.db.collection('users').findOne({ email: 'alexhuang392@yahoo.com' });

  if (!alexHuangUser || !alexUser) {
    throw new Error('Both users must exist in MongoDB for the test');
  }

  const tokenOwner = jwt.sign({ userId: alexHuangUser._id }, SECRET, { expiresIn: '1h' });
  const tokenGuest = jwt.sign({ userId: alexUser._id }, SECRET, { expiresIn: '1h' });

  console.log('Owner (Alex HUANG):', alexHuangUser.email);
  console.log('Guest (alex):', alexUser.email);

  // 1. Owner creates a book
  const resCreate = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Livre de Test Partage',
      description: 'Livre partagé Google Docs style',
    }),
  });
  if (!resCreate.ok) throw new Error(`Failed to create book: ${await resCreate.text()}`);
  const book = await resCreate.json();
  const bookId = book._id;
  console.log('1. Book created by owner:', book.title, `(${bookId})`);

  // 2. Guest does NOT see the book initially
  const resGuestInitial = await fetch(`${API_BASE}/books`, {
    headers: { Authorization: `Bearer ${tokenGuest}` },
  });
  const guestBooksInitial = await resGuestInitial.json();
  if (guestBooksInitial.some((b) => b._id === bookId)) {
    throw new Error('Guest should not see book before being invited');
  }
  console.log('✓ 2. Verified guest does NOT see book initially');

  // 3. Owner shares the book with Guest as 'viewer'
  const resShare = await fetch(`${API_BASE}/books/${bookId}/share`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: alexUser.email,
      role: 'viewer',
    }),
  });
  if (!resShare.ok) throw new Error(`Share failed: ${await resShare.text()}`);
  const shareResult = await resShare.json();
  console.log('3. Book shared with guest as viewer. Collaborators count:', shareResult.collaboratorsCount);
  if (shareResult.collaboratorsCount !== 1) throw new Error('Expected 1 collaborator');

  // 4. Guest fetches books -> must see the book with role 'viewer' and isOwner: false
  const resGuestBooks = await fetch(`${API_BASE}/books`, {
    headers: { Authorization: `Bearer ${tokenGuest}` },
  });
  const guestBooks = await resGuestBooks.json();
  const sharedBookForGuest = guestBooks.find((b) => b._id === bookId);
  if (!sharedBookForGuest) throw new Error('Guest does not see shared book in their library');
  if (sharedBookForGuest.isOwner !== false) throw new Error('isOwner should be false for guest');
  if (sharedBookForGuest.myRole !== 'viewer') throw new Error(`Expected myRole 'viewer', got ${sharedBookForGuest.myRole}`);
  if (sharedBookForGuest.collaboratorsCount !== 1) throw new Error('Expected collaboratorsCount to be 1');
  console.log('✓ 4. Guest sees shared book with role viewer & 👥 count 1');

  // 5. Guest reads book content -> allowed
  const resContent = await fetch(`${API_BASE}/books/${bookId}/content`, {
    headers: { Authorization: `Bearer ${tokenGuest}` },
  });
  if (!resContent.ok) throw new Error(`Guest should be able to read content: ${await resContent.text()}`);
  const content = await resContent.json();
  if (content.book.myRole !== 'viewer') throw new Error('Content book myRole should be viewer');
  console.log('✓ 5. Guest can read book content');

  // 6. Guest attempts to create a label -> MUST return 403 Forbidden
  const resGuestLabel = await fetch(`${API_BASE}/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenGuest}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Label Interdit',
      bookId,
    }),
  });
  console.log('6. Guest creating label status:', resGuestLabel.status);
  if (resGuestLabel.status !== 403) {
    throw new Error(`Expected 403 for viewer creating label, got ${resGuestLabel.status}`);
  }
  console.log('✓ 6. Verified: Viewer cannot create labels (403)');

  // 7. Guest attempts to create a product -> MUST return 403 Forbidden
  const resGuestProduct = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenGuest}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Produit Interdit',
      bookId,
    }),
  });
  console.log('7. Guest creating product status:', resGuestProduct.status);
  if (resGuestProduct.status !== 403) {
    throw new Error(`Expected 403 for viewer creating product, got ${resGuestProduct.status}`);
  }
  console.log('✓ 7. Verified: Viewer cannot create products (403)');

  // 8. Owner promotes guest to 'editor'
  const collabId = shareResult.collaborators[0]._id;
  const resPromote = await fetch(`${API_BASE}/books/${bookId}/share/${collabId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'editor' }),
  });
  if (!resPromote.ok) throw new Error(`Promotion failed: ${await resPromote.text()}`);
  console.log('8. Owner promoted guest to editor');

  // 9. Guest creates a label -> NOW allowed
  const resEditorLabel = await fetch(`${API_BASE}/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenGuest}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Label Collaborateur',
      color: '#10b981',
      bookId,
    }),
  });
  if (!resEditorLabel.ok) throw new Error(`Editor should be able to create label: ${await resEditorLabel.text()}`);
  const createdLabel = await resEditorLabel.json();
  console.log('✓ 9. Editor created label:', createdLabel.name);

  // 10. Guest creates a product -> NOW allowed
  const resEditorProduct = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenGuest}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Produit Collaborateur',
      bookId,
      labelIds: [createdLabel._id],
    }),
  });
  if (!resEditorProduct.ok) throw new Error(`Editor should be able to create product: ${await resEditorProduct.text()}`);
  const createdProduct = await resEditorProduct.json();
  console.log('✓ 10. Editor created product:', createdProduct.name);

  // 11. Guest tries to share book or manage permissions -> MUST return 403 (only owner can manage shares)
  const resEditorShare = await fetch(`${API_BASE}/books/${bookId}/share`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenGuest}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'another@example.com',
      role: 'viewer',
    }),
  });
  if (resEditorShare.status !== 403) {
    throw new Error(`Expected 403 when editor tries to share, got ${resEditorShare.status}`);
  }
  console.log('✓ 11. Verified: Non-owner cannot manage sharing (403)');

  // 12. Guest leaves the book (DELETE /api/books/:id as non-owner)
  const resLeave = await fetch(`${API_BASE}/books/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenGuest}` },
  });
  if (!resLeave.ok) throw new Error(`Leave book failed: ${await resLeave.text()}`);
  const leaveData = await resLeave.json();
  if (!leaveData.leftBook) throw new Error('Expected leftBook to be true');
  console.log('✓ 12. Guest left the shared book');

  // 13. Verify Guest no longer sees the book
  const resGuestAfterLeave = await fetch(`${API_BASE}/books`, {
    headers: { Authorization: `Bearer ${tokenGuest}` },
  });
  const guestBooksAfterLeave = await resGuestAfterLeave.json();
  if (guestBooksAfterLeave.some((b) => b._id === bookId)) {
    throw new Error('Guest still sees book after leaving!');
  }
  console.log('✓ 13. Verified guest no longer sees book');

  // 14. Owner still has the book and can delete it completely
  const resDeleteOwner = await fetch(`${API_BASE}/books/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenOwner}` },
  });
  if (!resDeleteOwner.ok) throw new Error(`Owner delete failed: ${await resDeleteOwner.text()}`);
  console.log('✓ 14. Owner deleted the book');

  await mongoose.disconnect();
  console.log('\n=============================================');
  console.log('🎉 ALL BOOK SHARING & ROLE TESTS PASSED 100%!');
  console.log('=============================================\n');
}

runSharingTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
