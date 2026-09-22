import express from 'express';
import {
  createLabel,
  updateLabel,
  deleteLabel,
} from '../controllers/labelController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createLabel);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);

export default router;
