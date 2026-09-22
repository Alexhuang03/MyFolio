import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

function isValidEmail(email) {
  return typeof email === 'string' &&
    email.length <= 100 &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, termsAccepted } = req.body;

    if (!termsAccepted || (termsAccepted !== true && termsAccepted !== 'true')) {
      return res.status(400).json({ error: "Vous devez accepter les Conditions d'Utilisation et la Politique de Confidentialité." });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Nom requis (texte valide)' });
    }
    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Nom trop long (50 caractères maximum)' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Format d'e-mail invalide" });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Mot de passe trop long (128 caractères maximum)' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(409).json({ error: 'Cet e-mail est déjà utilisé' });
    }

    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password,
      termsAcceptedAt: new Date(),
    });
    await user.save();

    const secret = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const secret = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

    res.json({ token, user });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    res.json({ user });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'E-mail requis' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: "Format d'e-mail invalide" });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.json({ message: 'Si cet e-mail existe, un lien a été envoyé.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    await user.save();

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/?reset_token=${token}`;

    console.log(`[Auth] 🔑 Lien de réinitialisation pour ${user.email} : ${resetLink}`);

    res.json({
      message: 'Un e-mail de réinitialisation a été envoyé.',
      resetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined,
    });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la demande de réinitialisation' });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token invalide' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' });
    }

    user.passwordHash = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Votre mot de passe a été réinitialisé avec succès.' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la réinitialisation du mot de passe' });
  }
});

export default router;

