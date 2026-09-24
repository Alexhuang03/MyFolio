import express from 'express';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBookContent,
  shareBook,
  updateCollaboratorRole,
  removeCollaborator,
} from '../controllers/bookController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Toutes les routes des livres sont strictement protégées par authentification
router.use(authMiddleware);

router.get('/', getBooks);
router.post('/', createBook);
router.get('/:id', getBookById);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);
router.get('/:id/content', getBookContent);

// Routes de partage et gestion des permissions (Google Docs style)
router.post('/:id/share', shareBook);
router.patch('/:id/share/:collaboratorId', updateCollaboratorRole);
router.delete('/:id/share/:collaboratorId', removeCollaborator);

export default router;
