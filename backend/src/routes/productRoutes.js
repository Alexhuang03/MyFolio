import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../controllers/productController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Types MIME d'images autorisés (exclusion stricte des SVG pour éviter le stored XSS)
const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeExt = ALLOWED_MIME_TYPES[file.mimetype] || '.jpg';
    cb(null, 'prod-' + uniqueSuffix + safeExt);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      const error = new Error('Format de fichier non autorisé. Formats acceptés : JPEG, PNG, WEBP, GIF.');
      error.code = 'INVALID_FILE_TYPE';
      cb(error);
    }
  },
});

const router = express.Router();

router.use(authMiddleware);

router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Middleware d'upload sécurisé avec capture d'erreurs (limite de taille, format)
router.post('/upload', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image trop volumineuse. La taille maximale autorisée est de 2 Mo.' });
      }
      return res.status(400).json({ message: err.message || "Erreur lors de l'envoi de l'image." });
    }
    uploadProductImage(req, res, next);
  });
});

export default router;
