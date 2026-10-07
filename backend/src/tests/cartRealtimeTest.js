import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { io as ioClient } from 'socket.io-client';

const API_BASE = 'http://127.0.0.1:5000/api';
const SOCKET_URL = 'http://127.0.0.1:5000';
const SECRET = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';

function waitForEvent(socket, eventName, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for socket event: ${eventName}`));
    }, timeoutMs);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runCartRealtimeTest() {
  console.log('--- STARTING SHARED REAL-TIME CART TEST ---');

  await mongoose.connect('mongodb://127.0.0.1:27017/myfolio');

  const alexHuangUser = await mongoose.connection.db.collection('users').findOne({ email: 'alex.huang@edu.ece.fr' });
  const alexUser = await mongoose.connection.db.collection('users').findOne({ email: 'alexhuang392@yahoo.com' });

  if (!alexHuangUser || !alexUser) {
    throw new Error('Both test users must exist in DB');
  }

  const tokenOwner = jwt.sign({ userId: alexHuangUser._id }, SECRET, { expiresIn: '1h' });
  const tokenGuest = jwt.sign({ userId: alexUser._id }, SECRET, { expiresIn: '1h' });

  const socketA = ioClient(SOCKET_URL, {
    auth: { token: tokenOwner },
    transports: ['websocket'],
  });

  const socketB = ioClient(SOCKET_URL, {
    auth: { token: tokenGuest },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise((resolve, reject) => {
      socketA.on('connect', resolve);
      socketA.on('connect_error', reject);
    }),
    new Promise((resolve, reject) => {
      socketB.on('connect', resolve);
      socketB.on('connect_error', reject);
    }),
  ]);

  console.log('✓ 1. Both sockets connected');

  // 1. Owner creates a book
  const createBookRes = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenOwner}` },
    body: JSON.stringify({ title: 'Livre Test Panier Partagé' }),
  });
  const book = await createBookRes.json();
  const bookId = book._id;
  console.log(`2. Book created: ${bookId}`);

  // 2. Share book with Guest
  await fetch(`${API_BASE}/books/${bookId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenOwner}` },
    body: JSON.stringify({ email: alexUser.email, role: 'editor' }),
  });

  // Both join the room
  socketA.emit('join_book', bookId);
  socketB.emit('join_book', bookId);
  await new Promise((r) => setTimeout(r, 200));

  // 3. Create 2 products
  const p1Res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenOwner}` },
    body: JSON.stringify({ name: 'Article 1', bookId }),
  });
  const p1 = await p1Res.json();

  const p2Res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenOwner}` },
    body: JSON.stringify({ name: 'Article 2', bookId }),
  });
  const p2 = await p2Res.json();

  console.log('3. Products created:', p1.name, p2.name);

  // 4. Guest adds both products to cart -> Owner receives cart:updated
  const promiseAdd = waitForEvent(socketA, 'cart:updated');
  await fetch(`${API_BASE}/books/${bookId}/cart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenGuest}` },
    body: JSON.stringify({ action: 'add', productIds: [p1._id, p2._id] }),
  });
  const addEvent = await promiseAdd;
  if (!addEvent.cart.itemIds.includes(p1._id) || !addEvent.cart.itemIds.includes(p2._id)) {
    throw new Error('Owner did not receive both items in cart:updated');
  }
  console.log('✓ 4. Guest added items to cart -> Owner received cart:updated in real-time');

  // 5. Guest crosses out / checks Article 1 (toggle_completed) -> Owner receives cart:updated with completedIds
  const promiseToggle = waitForEvent(socketA, 'cart:updated');
  await fetch(`${API_BASE}/books/${bookId}/cart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenGuest}` },
    body: JSON.stringify({ action: 'toggle_completed', productId: p1._id }),
  });
  const toggleEvent = await promiseToggle;
  if (!toggleEvent.cart.completedIds.includes(p1._id)) {
    throw new Error('Owner did not receive completed item in cart:updated');
  }
  console.log('✓ 5. Guest crossed out item 1 -> Owner received cart:updated with item 1 marked as completed in real-time');

  // 6. Owner uncrosses Article 1 -> Guest receives cart:updated
  const promiseUntoggle = waitForEvent(socketB, 'cart:updated');
  await fetch(`${API_BASE}/books/${bookId}/cart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenOwner}` },
    body: JSON.stringify({ action: 'toggle_completed', productId: p1._id }),
  });
  const untoggleEvent = await promiseUntoggle;
  if (untoggleEvent.cart.completedIds.includes(p1._id)) {
    throw new Error('Guest still sees completed item after untoggle');
  }
  console.log('✓ 6. Owner uncrossed item 1 -> Guest received cart:updated in real-time');

  // 7. Owner removes Article 2 -> Guest receives cart:updated
  const promiseRemove = waitForEvent(socketB, 'cart:updated');
  await fetch(`${API_BASE}/books/${bookId}/cart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenOwner}` },
    body: JSON.stringify({ action: 'remove', productId: p2._id }),
  });
  const removeEvent = await promiseRemove;
  if (removeEvent.cart.itemIds.includes(p2._id)) {
    throw new Error('Article 2 still in cart after removal');
  }
  console.log('✓ 7. Owner removed Article 2 -> Guest received cart:updated in real-time');

  // 8. Guest clears cart -> Owner receives cart:updated with empty arrays
  const promiseClear = waitForEvent(socketA, 'cart:updated');
  await fetch(`${API_BASE}/books/${bookId}/cart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenGuest}` },
    body: JSON.stringify({ action: 'clear' }),
  });
  const clearEvent = await promiseClear;
  if (clearEvent.cart.itemIds.length !== 0 || clearEvent.cart.completedIds.length !== 0) {
    throw new Error('Cart not empty after clear');
  }
  console.log('✓ 8. Guest cleared cart -> Owner received cart:updated with empty cart in real-time');

  // 9. Clean up
  await fetch(`${API_BASE}/books/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenOwner}` },
  });
  console.log('9. Cleaned up test book');

  socketA.disconnect();
  socketB.disconnect();
  await mongoose.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL SHARED REAL-TIME CART TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runCartRealtimeTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
