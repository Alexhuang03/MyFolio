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

async function runRealtimeTest() {
  console.log('--- STARTING SOCKET.IO REAL-TIME COLLABORATION TEST ---');

  await mongoose.connect('mongodb://127.0.0.1:27017/myfolio');

  const alexHuangUser = await mongoose.connection.db.collection('users').findOne({ email: 'alex.huang@edu.ece.fr' });
  const alexUser = await mongoose.connection.db.collection('users').findOne({ email: 'alexhuang392@yahoo.com' });

  if (!alexHuangUser || !alexUser) {
    throw new Error('Both test users must exist in DB');
  }

  const tokenOwner = jwt.sign({ userId: alexHuangUser._id }, SECRET, { expiresIn: '1h' });
  const tokenGuest = jwt.sign({ userId: alexUser._id }, SECRET, { expiresIn: '1h' });

  console.log('Connecting Socket A (Owner)...');
  const socketA = ioClient(SOCKET_URL, {
    auth: { token: tokenOwner },
    transports: ['websocket'],
  });

  console.log('Connecting Socket B (Guest)...');
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

  console.log('✓ 1. Both sockets connected and authenticated successfully via JWT');

  // 2. Owner creates a book
  const resCreateBook = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Livre Temps Réel Collab',
      description: 'Test WebSockets',
    }),
  });
  const book = await resCreateBook.json();
  const bookId = book._id;
  console.log('2. Owner created book:', book.title, `(${bookId})`);

  // 3. Prepare listener for 'book:shared' on Guest's socket
  const sharedPromise = waitForEvent(socketB, 'book:shared');

  // Owner shares book with Guest
  console.log('3. Sharing book with guest...');
  const resShare = await fetch(`${API_BASE}/books/${bookId}/share`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: alexUser.email,
      role: 'editor',
    }),
  });
  if (!resShare.ok) throw new Error('Share request failed');

  // Guest must receive 'book:shared' in real time!
  const sharedData = await sharedPromise;
  console.log('✓ 3. Guest received real-time event "book:shared":', sharedData.title, `(myRole: ${sharedData.myRole})`);
  if (sharedData._id !== bookId) throw new Error('Shared book ID mismatch');

  // 4. Both join the book room
  socketA.emit('join_book', bookId);
  socketB.emit('join_book', bookId);
  await new Promise((r) => setTimeout(r, 200));

  // 5. Owner creates a product -> Guest receives 'product:created' in real time!
  const productCreatedPromise = waitForEvent(socketB, 'product:created');
  console.log('5. Owner creating product...');
  const resCreateProd = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenOwner}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Figurine Zelda Collector',
      bookId,
      price: 59.99,
    }),
  });
  if (!resCreateProd.ok) throw new Error('Product creation failed');
  const createdProd = await resCreateProd.json();

  const receivedProd = await productCreatedPromise;
  console.log('✓ 5. Guest received real-time event "product:created":', receivedProd.name, `(${receivedProd.price} €)`);
  if (receivedProd._id !== createdProd._id) throw new Error('Product ID mismatch');

  // 6. Guest updates product -> Owner receives 'product:updated' in real time!
  const productUpdatedPromise = waitForEvent(socketA, 'product:updated');
  console.log('6. Guest updating product...');
  const resUpdateProd = await fetch(`${API_BASE}/products/${createdProd._id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tokenGuest}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Figurine Zelda Collector Edition Limitée',
      price: 79.99,
    }),
  });
  if (!resUpdateProd.ok) throw new Error('Product update failed');

  const receivedUpdatedProd = await productUpdatedPromise;
  console.log('✓ 6. Owner received real-time event "product:updated":', receivedUpdatedProd.name, `(${receivedUpdatedProd.price} €)`);

  // 7. Owner removes Guest -> Guest receives 'book:removed' in real time!
  const bookRemovedPromise = waitForEvent(socketB, 'book:removed');
  console.log('7. Owner removing collaborator...');
  const collab = (await resShare.json()).collaborators.find((c) => c.email === alexUser.email);
  const resRemove = await fetch(`${API_BASE}/books/${bookId}/share/${alexUser._id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${tokenOwner}`,
    },
  });
  if (!resRemove.ok) throw new Error('Remove collaborator failed');

  const removedData = await bookRemovedPromise;
  console.log('✓ 7. Guest received real-time event "book:removed":', removedData.bookId);

  // 8. Cleanup test book
  await fetch(`${API_BASE}/books/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenOwner}` },
  });

  socketA.disconnect();
  socketB.disconnect();
  await mongoose.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL SOCKET.IO REAL-TIME COLLABORATION TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runRealtimeTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
