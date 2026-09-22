import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://127.0.0.1:5000/api';
const SECRET = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';

async function runTest() {
  console.log('--- STARTING MULTI-USER ISOLATION TEST ---');

  await mongoose.connect('mongodb://127.0.0.1:27017/myfolio');

  const alexHuangUser = await mongoose.connection.db.collection('users').findOne({ email: 'alex.huang@edu.ece.fr' });
  const alexUser = await mongoose.connection.db.collection('users').findOne({ email: 'alexhuang392@yahoo.com' });

  if (!alexHuangUser || !alexUser) {
    throw new Error('Both users must exist for the test');
  }

  const tokenHuang = jwt.sign({ userId: alexHuangUser._id }, SECRET, { expiresIn: '1h' });
  const tokenAlex = jwt.sign({ userId: alexUser._id }, SECRET, { expiresIn: '1h' });

  console.log('User 1 (Alex HUANG):', alexHuangUser._id.toString());
  console.log('User 2 (alex):', alexUser._id.toString());

  // 1. Alex HUANG creates a book
  const resCreateHuang = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenHuang}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Livre Privé de Alex HUANG',
      description: 'Ce livre appartient uniquement à Alex HUANG',
      coverImage: 'cover-classic.svg',
      colorTheme: '#3b82f6',
    }),
  });
  if (!resCreateHuang.ok) {
    throw new Error(`Alex HUANG failed to create book: ${await resCreateHuang.text()}`);
  }
  const huangBook = await resCreateHuang.json();
  console.log('1. Alex HUANG created book:', huangBook.title, '(ID:', huangBook._id, ')');

  // 2. alex fetches books -> MUST NOT contain huangBook
  const resAlexBooks = await fetch(`${API_BASE}/books`, {
    headers: { Authorization: `Bearer ${tokenAlex}` },
  });
  const alexBooks = await resAlexBooks.json();
  console.log('2. alex books count:', alexBooks.length);
  const leakedToAlex = alexBooks.find(b => b._id === huangBook._id);
  if (leakedToAlex) {
    throw new Error('SECURITY BREACH: alex can see Alex HUANG\'s book!');
  }
  console.log('✓ Verified: alex does NOT see Alex HUANG\'s book');

  // 3. alex creates their own book
  const resCreateAlex = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAlex}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Livre Privé de alex',
      description: 'Ce livre appartient uniquement à alex',
      coverImage: 'cover-classic.svg',
      colorTheme: '#10b981',
    }),
  });
  if (!resCreateAlex.ok) {
    throw new Error(`alex failed to create book: ${await resCreateAlex.text()}`);
  }
  const alexBook = await resCreateAlex.json();
  console.log('3. alex created book:', alexBook.title, '(ID:', alexBook._id, ')');

  // 4. alex fetches books -> should see only their book
  const resAlexBooksAfter = await fetch(`${API_BASE}/books`, {
    headers: { Authorization: `Bearer ${tokenAlex}` },
  });
  const alexBooksAfter = await resAlexBooksAfter.json();
  console.log('4. alex books count after creation:', alexBooksAfter.length);
  if (!alexBooksAfter.some(b => b._id === alexBook._id)) {
    throw new Error('alex does not see their own book');
  }
  if (alexBooksAfter.some(b => b._id === huangBook._id)) {
    throw new Error('SECURITY BREACH: alex sees Alex HUANG\'s book in the list!');
  }
  console.log('✓ Verified: alex sees their own book and NOT Alex HUANG\'s book');

  // 5. Alex HUANG fetches books -> should see only their book, NOT alex\'s book
  const resHuangBooks = await fetch(`${API_BASE}/books`, {
    headers: { Authorization: `Bearer ${tokenHuang}` },
  });
  const huangBooks = await resHuangBooks.json();
  console.log('5. Alex HUANG books count:', huangBooks.length);
  if (!huangBooks.some(b => b._id === huangBook._id)) {
    throw new Error('Alex HUANG does not see their own book');
  }
  if (huangBooks.some(b => b._id === alexBook._id)) {
    throw new Error('SECURITY BREACH: Alex HUANG sees alex\'s book in the list!');
  }
  console.log('✓ Verified: Alex HUANG sees their own book and NOT alex\'s book');

  // 6. Cross-access test: Alex HUANG tries to read alex\'s book content
  const resCrossRead = await fetch(`${API_BASE}/books/${alexBook._id}/content`, {
    headers: { Authorization: `Bearer ${tokenHuang}` },
  });
  console.log('6. Alex HUANG accessing alex book content status:', resCrossRead.status);
  if (resCrossRead.status !== 404) {
    throw new Error(`Expected 404 on cross-read, got ${resCrossRead.status}`);
  }
  console.log('✓ Verified: Cross-user book access is blocked (404 Not Found)');

  // 7. Cross-mutation test: Alex HUANG tries to add a label in alex\'s book
  const resCrossLabel = await fetch(`${API_BASE}/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenHuang}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Hack Label',
      bookId: alexBook._id,
    }),
  });
  console.log('7. Alex HUANG injecting label into alex book status:', resCrossLabel.status);
  if (resCrossLabel.status !== 404 && resCrossLabel.status !== 403) {
    throw new Error(`Expected 404/403 on cross-label creation, got ${resCrossLabel.status}`);
  }
  console.log('✓ Verified: Cross-user label injection is blocked');

  // 8. Cross-mutation test: alex tries to delete Alex HUANG\'s book
  const resCrossDelete = await fetch(`${API_BASE}/books/${huangBook._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenAlex}` },
  });
  console.log('8. alex attempting to delete Alex HUANG\'s book status:', resCrossDelete.status);
  if (resCrossDelete.status !== 404) {
    throw new Error(`Expected 404 on cross-delete, got ${resCrossDelete.status}`);
  }
  console.log('✓ Verified: Cross-user book deletion is blocked');

  // 9. Cleanup: each user deletes their own test book
  await fetch(`${API_BASE}/books/${huangBook._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenHuang}` },
  });
  await fetch(`${API_BASE}/books/${alexBook._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenAlex}` },
  });
  console.log('9. Cleaned up test books');

  // 10. Verify final state
  const resFinalHuang = await fetch(`${API_BASE}/books`, { headers: { Authorization: `Bearer ${tokenHuang}` } });
  const resFinalAlex = await fetch(`${API_BASE}/books`, { headers: { Authorization: `Bearer ${tokenAlex}` } });
  const finalHuang = await resFinalHuang.json();
  const finalAlex = await resFinalAlex.json();
  console.log('10. Final books - Alex HUANG:', finalHuang.length, '| alex:', finalAlex.length);

  await mongoose.disconnect();
  console.log('\n=============================================');
  console.log('🎉 ALL MULTI-USER ISOLATION TESTS PASSED 100%!');
  console.log('=============================================\n');
}

runTest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
