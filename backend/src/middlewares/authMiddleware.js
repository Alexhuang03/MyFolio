import jwt from 'jsonwebtoken';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security] JWT_SECRET doit impérativement être défini en production !');
    }
    return 'myfolio_super_secret_jwt_key_2026';
  }
  return secret;
}

export function authMiddleware(req, res, next) {
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.slice(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
