import express from 'express';
import {
  createSubLabel,
  updateSubLabel,
  deleteSubLabel,
} from '../controllers/subLabelController.js';

const router = express.Router();

router.post('/', createSubLabel);
router.put('/:id', updateSubLabel);
router.delete('/:id', deleteSubLabel);

export default router;
