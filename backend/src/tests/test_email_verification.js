import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myfolio';
const API_URL = 'http://127.0.0.1:5000/api/auth';

async function runTests() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const testEmail = `test_otp_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test OTP User';

  try {
    // 1. Inscription
    console.log('\n--- 1. Testing Registration with 6-digit Code ---');
    const regRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        termsAccepted: true,
      }),
    });
    const regData = await regRes.json();
    console.log('Register status:', regRes.status, 'Response:', regData);
    if (!regData.verificationCode || regData.verificationCode.length !== 6) {
      throw new Error('Registration should return a 6-digit verificationCode in dev mode');
    }
    const code = regData.verificationCode;
    console.log('Generated 6-digit Code:', code);

    // 2. Test avec un mauvais code
    console.log('\n--- 2. Testing Wrong Code ---');
    const wrongRes = await fetch(`${API_URL}/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        code: '999999',
      }),
    });
    const wrongData = await wrongRes.json();
    console.log('Wrong code status:', wrongRes.status, 'Response:', wrongData);
    if (wrongRes.status !== 400) {
      throw new Error('Wrong code should be rejected with 400');
    }

    // 3. Test avec le bon code à 6 chiffres
    console.log('\n--- 3. Testing Correct 6-digit Code ---');
    const okRes = await fetch(`${API_URL}/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        code: code,
      }),
    });
    const okData = await okRes.json();
    console.log('Verify code status:', okRes.status, 'User:', okData.user?.name);
    if (okRes.status !== 200 || !okData.token) {
      throw new Error('Valid code should verify user and return JWT token');
    }

    const verifiedUser = await User.findOne({ email: testEmail });
    console.log('User in DB isVerified:', verifiedUser.isVerified);
    console.log('Code cleared in DB:', verifiedUser.verificationCode == null);

    // 4. Test login post-validation
    console.log('\n--- 4. Testing Login after OTP verification ---');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status, 'Token exists:', Boolean(loginData.token));
    if (loginRes.status !== 200) {
      throw new Error('Login failed after OTP verification');
    }

    // Cleanup
    await User.deleteOne({ email: testEmail });
    console.log('\nSUCCESS: 6-digit OTP verification works flawlessly!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
