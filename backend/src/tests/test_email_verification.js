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

  const testEmail = `test_verify_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test Verification User';

  try {
    // 1. Test Honeypot (bot registration)
    console.log('\n--- 1. Testing Honeypot Bot Trap ---');
    const botRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Spam Bot',
        email: `bot_${Date.now()}@spambot.com`,
        password: 'Password123!',
        termsAccepted: true,
        hp_website: 'https://spam-bot-trap.com',
      }),
    });
    const botData = await botRes.json();
    console.log('Bot register status:', botRes.status, 'Response:', botData);
    const botInDb = await User.findOne({ email: botData.email });
    if (!botInDb) {
      console.log('SUCCESS: Honeypot blocked user creation in database!');
    } else {
      console.error('FAILURE: Honeypot user was created in DB');
    }

    // 2. Normal Registration (requires email confirmation)
    console.log('\n--- 2. Testing Normal Registration ---');
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
    if (!regData.requiresVerification) {
      throw new Error('Registration should require verification!');
    }

    const unverifiedUser = await User.findOne({ email: testEmail });
    console.log('User in DB isVerified:', unverifiedUser.isVerified);
    console.log('Verification Token in DB exists:', Boolean(unverifiedUser.verificationToken));

    // 3. Login Attempt before Verification (Must be rejected with 403 & EMAIL_NOT_VERIFIED)
    console.log('\n--- 3. Testing Login Before Verification ---');
    const loginFailRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginFailData = await loginFailRes.json();
    console.log('Login status:', loginFailRes.status, 'Response:', loginFailData);
    if (loginFailRes.status === 403 && loginFailData.code === 'EMAIL_NOT_VERIFIED') {
      console.log('SUCCESS: Login blocked for unverified account with code EMAIL_NOT_VERIFIED!');
    } else {
      throw new Error(`Login should have failed with 403 and EMAIL_NOT_VERIFIED, got ${loginFailRes.status}`);
    }

    // 4. Resend Verification Link
    console.log('\n--- 4. Testing Resend Verification ---');
    const resendRes = await fetch(`${API_URL}/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const resendData = await resendRes.json();
    console.log('Resend status:', resendRes.status, 'Response:', resendData);

    // 5. Verify Email using Token
    console.log('\n--- 5. Testing Email Verification via Token ---');
    const updatedUser = await User.findOne({ email: testEmail });
    const token = updatedUser.verificationToken;
    const verifyRes = await fetch(`${API_URL}/verify-email/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const verifyData = await verifyRes.json();
    console.log('Verify status:', verifyRes.status, 'Response:', verifyData);
    if (!verifyData.token || !verifyData.user) {
      throw new Error('Verification should log user in and return token/user');
    }

    const verifiedUser = await User.findOne({ email: testEmail });
    console.log('User in DB after verification isVerified:', verifiedUser.isVerified);
    console.log('Token cleared in DB:', verifiedUser.verificationToken == null);

    // 6. Login Attempt after Verification (Must succeed)
    console.log('\n--- 6. Testing Login After Verification ---');
    const loginOkRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginOkData = await loginOkRes.json();
    console.log('Login status:', loginOkRes.status, 'User:', loginOkData.user?.name);
    if (loginOkRes.status === 200 && loginOkData.token) {
      console.log('SUCCESS: Login succeeds after verification!');
    } else {
      throw new Error('Login failed after verification!');
    }

    // Cleanup test user
    await User.deleteOne({ email: testEmail });
    console.log('\nCleaned up test user.');
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
