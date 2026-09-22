import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import bookRoutes from './routes/bookRoutes.js';
import labelRoutes from './routes/labelRoutes.js';
import subLabelRoutes from './routes/subLabelRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// 1. En-têtes HTTP de sécurité avec Helmet & CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permet au frontend de charger les images hébergées dans /uploads
  })
);

// 2. CORS restreint aux origines autorisées
const allowedOrigins = [
  process.env.APP_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (CLI, mêmes domaines) ou dans la liste blanche, ou en dev
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Origine non autorisée par la politique CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

// 3. Parsing du corps de requête avec limite stricte (Anti-DoS)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Rate Limiting global pour toutes les routes API (300 requêtes / 15 min par IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Veuillez patienter avant de réessayer.' },
});
app.use('/api', globalLimiter);

// 5. Fichiers statiques pour les uploads sécurisés (pas d'exécution, nosniff)
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'ignore',
    etag: true,
    index: false,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
    },
  })
);

// 6. Routes API
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/sublabels', subLabelRoutes);
app.use('/api/products', productRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MyFolio API',
  });
});

// 7. Middleware d'erreur global (masque les traces sensibles en production)
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.message || err);

  if (err.message === 'Origine non autorisée par la politique CORS') {
    return res.status(403).json({ error: err.message });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    error: isProd && statusCode === 500 ? 'Une erreur interne est survenue' : (err.message || 'Erreur interne'),
  });
});

// Démarrage du serveur et connexion DB
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, HOST, () => {
      console.log(`[Server] MyFolio API running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
export default app;
