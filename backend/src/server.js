import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import bookRoutes from './routes/bookRoutes.js';
import labelRoutes from './routes/labelRoutes.js';
import subLabelRoutes from './routes/subLabelRoutes.js';
import productRoutes from './routes/productRoutes.js';
import Book from './models/Book.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques pour les uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
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

// Démarrage du serveur et connexion DB
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty
    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      console.log('[Server] Database is empty. Auto-seeding demo "Menu Gourmand" book...');
      const { seedData } = await import('./seeds/seedData.js');
      await seedData();
    }

    app.listen(PORT, HOST, () => {
      console.log(`[Server] MyFolio API running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

startServer();

export default app;
