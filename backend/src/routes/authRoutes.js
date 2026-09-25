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

function hasSmtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendMailHelper({ to, subject, html, text }) {
  if (!hasSmtpConfigured()) {
    return false;
  }
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
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error('[Auth] SMTP Error:', err.message);
    return false;
  }
}

function getVerificationEmailHtml(userName, verifyLink) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: auto; padding: 2.5rem; background: #fafaf9; border-radius: 16px; border: 1px solid #e7e5e4;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #d97706; margin: 0; font-size: 1.75rem; font-family: serif;">MyFolio</h1>
        <p style="color: #78716c; font-size: 0.875rem; margin-top: 0.25rem;">Organisez vos collections avec élégance</p>
      </div>
      <h2 style="color: #1c1917; font-size: 1.15rem; margin-bottom: 1rem;">Confirmez votre adresse e-mail</h2>
      <p style="color: #44403c; font-size: 0.95rem; line-height: 1.6;">Bonjour <strong>${userName}</strong>,</p>
      <p style="color: #44403c; font-size: 0.95rem; line-height: 1.6;">Merci de vous être inscrit sur MyFolio ! Pour activer votre compte et sécuriser vos collections, veuillez cliquer sur le bouton ci-dessous :</p>
      <div style="text-align: center; margin: 2rem 0;">
        <a href="${verifyLink}" style="display: inline-block; padding: 0.85rem 2rem; background: #d97706; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2);">
          Confirmer mon compte
        </a>
      </div>
      <p style="color: #78716c; font-size: 0.85rem; line-height: 1.5; border-top: 1px solid #e7e5e4; padding-top: 1.25rem; margin-top: 2rem;">
        Ce lien est valable pendant <strong>24 heures</strong>.<br>
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
      </p>
    </div>
  `;
}

function getPasswordResetEmailHtml(userName, resetLink) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: auto; padding: 2.5rem; background: #fafaf9; border-radius: 16px; border: 1px solid #e7e5e4;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #d97706; margin: 0; font-size: 1.75rem; font-family: serif;">MyFolio</h1>
        <p style="color: #78716c; font-size: 0.875rem; margin-top: 0.25rem;">Organisez vos collections avec élégance</p>
      </div>
      <h2 style="color: #1c1917; font-size: 1.15rem; margin-bottom: 1rem;">Réinitialisation de votre mot de passe</h2>
      <p style="color: #44403c; font-size: 0.95rem; line-height: 1.6;">Bonjour <strong>${userName}</strong>,</p>
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
  `;
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, termsAccepted, hp_website } = req.body;

    // Protection anti-bot : champ piège Honeypot invisible
    if (hp_website) {
      console.warn('[Auth] Tentative d\'inscription automatique détectée via honeypot');
      return res.status(400).json({ error: 'Inscription rejetée (détection anti-bot).' });
    }

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
    const existingUser = await User.findOne({ email: cleanEmail });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const verifyLink = `${appUrl}/?verify_token=${verificationToken}`;

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({ error: 'Cet e-mail est déjà utilisé' });
      }

      // Utilisateur existant mais non vérifié : renouveler le token et renvoyer
      existingUser.name = name.trim();
      existingUser.passwordHash = password; // haché par le pre-save hook
      existingUser.verificationToken = verificationToken;
      existingUser.verificationTokenExpiry = verificationTokenExpiry;
      await existingUser.save();

      const emailSent = await sendMailHelper({
        to: existingUser.email,
        subject: '✉️ Confirmez votre adresse e-mail - MyFolio',
        html: getVerificationEmailHtml(existingUser.name, verifyLink),
      });

      console.log(`[Auth] ✉️ Lien d'activation pour ${existingUser.email} : ${verifyLink}`);

      return res.status(200).json({
        message: 'Un e-mail de confirmation a été envoyé pour activer votre compte.',
        requiresVerification: true,
        email: cleanEmail,
        verificationLink: (!hasSmtpConfigured() || process.env.NODE_ENV !== 'production') ? verifyLink : undefined,
        emailSent,
      });
    }

    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
      termsAcceptedAt: new Date(),
    });
    await user.save();

    const emailSent = await sendMailHelper({
      to: user.email,
      subject: '✉️ Confirmez votre adresse e-mail - MyFolio',
      html: getVerificationEmailHtml(user.name, verifyLink),
    });

    console.log(`[Auth] ✉️ Lien d'activation pour ${user.email} : ${verifyLink}`);

    res.status(201).json({
      message: 'Votre compte a été créé ! Veuillez confirmer votre adresse e-mail pour l\'activer.',
      requiresVerification: true,
      email: cleanEmail,
      verificationLink: (!hasSmtpConfigured() || process.env.NODE_ENV !== 'production') ? verifyLink : undefined,
      emailSent,
    });
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

    // Vérification de l'activation du compte
    if (!user.isVerified) {
      return res.status(403).json({
        error: "Veuillez confirmer votre adresse e-mail avant de vous connecter.",
        code: 'EMAIL_NOT_VERIFIED',
        email: cleanEmail,
      });
    }

    const secret = getJwtSecret();
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

    res.json({ token, user });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

// POST /api/auth/verify-email/:token
router.post('/verify-email/:token', authLimiter, async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: "Jeton d'activation invalide" });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Ce lien d'activation est invalide ou a expiré." });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    console.log(`[Auth] ✅ Compte activé avec succès pour ${user.email}`);

    // Connexion automatique après confirmation
    const secret = getJwtSecret();
    const jwtToken = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

    res.json({
      message: 'Votre compte a été activé avec succès !',
      token: jwtToken,
      user,
    });
  } catch (err) {
    console.error('[Auth] Verify email error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification de l\'e-mail' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'E-mail requis' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    // Si utilisateur inexistant ou déjà vérifié, protection contre l'énumération
    if (!user || user.isVerified) {
      return res.json({
        message: 'Si ce compte existe et nécessite une confirmation, un e-mail a été envoyé.',
        emailSent: false,
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const verifyLink = `${appUrl}/?verify_token=${verificationToken}`;
    const emailSent = await sendMailHelper({
      to: user.email,
      subject: '✉️ Confirmez votre adresse e-mail - MyFolio',
      html: getVerificationEmailHtml(user.name, verifyLink),
    });

    console.log(`[Auth] ✉️ Nouveau lien d'activation pour ${user.email} : ${verifyLink}`);

    res.json({
      message: 'Un nouvel e-mail de confirmation a été envoyé.',
      verificationLink: (!hasSmtpConfigured() || process.env.NODE_ENV !== 'production') ? verifyLink : undefined,
      emailSent,
    });
  } catch (err) {
    console.error('[Auth] Resend verification error:', err);
    res.status(500).json({ error: 'Erreur serveur lors du renvoi de l\'e-mail' });
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

