import assert from 'assert';
import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

async function runAuthTests() {
  console.log('=== AUTH TEST: User Model & Password Hashing ===');
  await connectDB();

  // Nettoyage des tests précédents
  await User.deleteMany({ email: 'test@myfolio.com' });

  // 1. Création d'un utilisateur
  const user = new User({
    name: 'Alice Folio',
    email: 'test@myfolio.com',
    passwordHash: 'secretPassword123',
    termsAcceptedAt: new Date(),
  });
  await user.save();
  console.log('✓ User created:', user.email);

  // Vérification que le mot de passe est bien haché
  assert.notStrictEqual(user.passwordHash, 'secretPassword123');
  assert(user.passwordHash.startsWith('$2'), 'Password hash should be bcrypt');
  console.log('✓ Password properly hashed with bcrypt');

  // 2. Vérification mot de passe
  const valid = await user.verifyPassword('secretPassword123');
  assert.strictEqual(valid, true, 'Valid password should verify');
  const invalid = await user.verifyPassword('wrongPassword');
  assert.strictEqual(invalid, false, 'Invalid password should fail');
  console.log('✓ Password verification works correctly');

  // 3. Sanitization toJSON
  const json = user.toJSON();
  assert.strictEqual(json.passwordHash, undefined, 'passwordHash should be hidden in JSON');
  assert.strictEqual(json.resetToken, undefined, 'resetToken should be hidden in JSON');
  console.log('✓ toJSON properly strips sensitive fields');

  // 4. JWT generation & verification
  const secret = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';
  const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });
  const payload = jwt.verify(token, secret);
  assert.strictEqual(payload.userId.toString(), user._id.toString());
  console.log('✓ JWT token generation and verification valid');

  // 5. Reset Token flow
  user.resetToken = 'sample-reset-token-xyz';
  user.resetTokenExpiry = new Date(Date.now() + 3600000);
  await user.save();

  const foundUser = await User.findOne({
    resetToken: 'sample-reset-token-xyz',
    resetTokenExpiry: { $gt: new Date() },
  });
  assert(foundUser, 'Should find user with valid unexpired reset token');
  console.log('✓ Reset token lookup valid');

  await User.deleteMany({ email: 'test@myfolio.com' });
  await closeDB();
  console.log('\n🎉 ALL AUTH TESTS PASSED SUCCESSFULLY!\n');
}

runAuthTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

