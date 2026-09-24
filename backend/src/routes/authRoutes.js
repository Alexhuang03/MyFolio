import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { authMiddleware, getJwtSecret } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rate limiter strict pour prévenir le brute-force et le spam
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 tentatives max par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives d'authentification. Veuillez patienter 15 minutes." },
});

function isValidEmail(email) {
  return typeof email === 'string' &&
    email.length <= 100 &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
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

    const secret = getJwtSecret();
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
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

    const secret = getJwtSecret();
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

// PUT /api/auth/profile - Mettre à jour les informations du profil
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, wallpaper, language, theme } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim().slice(0, 50);
    }
    if (wallpaper !== undefined && typeof wallpaper === 'string') {
      user.wallpaper = wallpaper;
    }
    if (language !== undefined && typeof language === 'string') {
      user.language = language;
    }
    if (theme !== undefined && typeof theme === 'string') {
      user.theme = theme;
    }

    await user.save();
    res.json({ user, message: 'Profil mis à jour avec succès' });
  } catch (err) {
    console.error('[Auth] Profile update error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du profil' });
  }
});

// PUT /api/auth/change-password - Changer le mot de passe
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Le mot de passe actuel est requis' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({ error: 'Le nouveau mot de passe est trop long (128 caractères maximum)' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const isMatch = await user.verifyPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Le mot de passe actuel est incorrect' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: 'Votre mot de passe a été modifié avec succès.' });
  } catch (err) {
    console.error('[Auth] Change password error:', err);
    res.status(500).json({ error: 'Erreur serveur lors du changement de mot de passe' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
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
      return res.json({ message: 'Si cet e-mail existe, un lien a été envoyé.', emailSent: false });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    await user.save();

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/?reset_token=${token}`;

    const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    let emailSent = false;

    if (hasSmtp) {
      try {
        const transporter = process.env.SMTP_SERVICE
          ? nodemailer.createTransport({
              service: process.env.SMTP_SERVICE,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            })
          : nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: Number(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });

        await transporter.sendMail({
          from: `"MyFolio" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: '🔑 Réinitialisation de votre mot de passe - MyFolio',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: auto; padding: 2.5rem; background: #fafaf9; border-radius: 16px; border: 1px solid #e7e5e4;">
              <div style="text-align: center; margin-bottom: 2rem;">
                <h1 style="color: #d97706; margin: 0; font-size: 1.75rem; font-family: serif;">MyFolio</h1>
                <p style="color: #78716c; font-size: 0.875rem; margin-top: 0.25rem;">Organisez vos collections avec élégance</p>
              </div>
              <h2 style="color: #1c1917; font-size: 1.15rem; margin-bottom: 1rem;">Réinitialisation de votre mot de passe</h2>
              <p style="color: #44403c; font-size: 0.95rem; line-height: 1.6;">Bonjour <strong>${user.name}</strong>,</p>
              <p style="color: #44403c; font-size: 0.95rem; line-height: 1.6;">Vous avez demandé la réinitialisation de votre mot de passe pour votre compte MyFolio. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :</p>
              <div style="text-align: center; margin: 2rem 0;">
                <a href="${resetLink}" style="display: inline-block; padding: 0.85rem 2rem; background: #d97706; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2);">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              <p style="color: #78716c; font-size: 0.85rem; line-height: 1.5; border-top: 1px solid #e7e5e4; padding-top: 1.25rem; margin-top: 2rem;">
                Ce lien est valable pendant <strong>1 heure</strong>.<br>
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
              </p>
            </div>
          `,
        });

        console.log(`[Auth] 📧 Email de réinitialisation envoyé avec succès à ${user.email}`);
        emailSent = true;
      } catch (mailErr) {
        console.error('[Auth] Erreur lors de l\'envoi de l\'e-mail SMTP:', mailErr.message);
      }
    }

    console.log(`[Auth] 🔑 Lien de réinitialisation pour ${user.email} : ${resetLink}`);

    res.json({
      message: emailSent
        ? 'Un e-mail de réinitialisation a été envoyé à votre adresse.'
        : 'Lien de réinitialisation généré.',
      resetLink,
      emailSent,
    });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la demande de réinitialisation' });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', authLimiter, async (req, res) => {
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

