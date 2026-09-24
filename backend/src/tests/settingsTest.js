import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://127.0.0.1:5000/api';
const SECRET = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';

async function runTest() {
  console.log('--- STARTING SETTINGS, PROFILE & PASSWORD CHANGE TEST ---');

  await mongoose.connect('mongodb://127.0.0.1:27017/myfolio');

  const user = await mongoose.connection.db.collection('users').findOne({});
  if (!user) {
    throw new Error('No user found');
  }

  const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1h' });
  console.log('Testing with user:', user.email);

  // 1. GET /api/auth/me
  const resMe = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resMe.ok) throw new Error(`GET /me failed: ${await resMe.text()}`);
  const meData = await resMe.json();
  console.log('✓ /me returned:', meData.user.name, meData.user.email, 'wallpaper:', meData.user.wallpaper);

  // 2. PUT /api/auth/profile (Update name and wallpaper)
  const resProfile = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: user.name, // keep original or append
      wallpaper: 'wood',
    }),
  });
  if (!resProfile.ok) throw new Error(`PUT /profile failed: ${await resProfile.text()}`);
  const profileData = await resProfile.json();
  console.log('✓ Profile updated with wallpaper:', profileData.user.wallpaper);

  if (profileData.user.wallpaper !== 'wood') {
    throw new Error('Wallpaper did not update');
  }

  // Restore wallpaper
  await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ wallpaper: 'default' }),
  });

  // 3. Test wrong current password on PUT /api/auth/change-password
  const resWrongPw = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword: 'wrong_password_123',
      newPassword: 'new_super_password_456',
    }),
  });
  if (resWrongPw.status !== 400) {
    throw new Error(`Expected 400 for wrong password, got ${resWrongPw.status}`);
  }
  console.log('✓ Correctly rejected invalid current password (400 Bad Request)');

  await mongoose.disconnect();
  console.log('--- ALL SETTINGS TESTS PASSED SUCCESSFULLY! ---');
}

runTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
