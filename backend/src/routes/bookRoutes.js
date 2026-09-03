import express from 'express';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBookContent,
} from '../controllers/bookController.js';

const router = express.Router();

router.get('/', getBooks);
router.post('/', createBook);
router.get('/:id', getBookById);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);
router.get('/:id/content', getBookContent);

export default router;
