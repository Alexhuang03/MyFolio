import express from 'express';
import {
  createSubLabel,
  updateSubLabel,
  deleteSubLabel,
} from '../controllers/subLabelController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createSubLabel);
router.put('/:id', updateSubLabel);
router.delete('/:id', deleteSubLabel);

export default router;
