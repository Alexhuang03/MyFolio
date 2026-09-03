import express from 'express';
import {
  createLabel,
  updateLabel,
  deleteLabel,
} from '../controllers/labelController.js';

const router = express.Router();

router.post('/', createLabel);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);

export default router;
