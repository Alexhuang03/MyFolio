import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.slice(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Non authentifie' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'myfolio_super_secret_jwt_key_2026';
    const payload = jwt.verify(token, secret);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expire' });
  }
}
