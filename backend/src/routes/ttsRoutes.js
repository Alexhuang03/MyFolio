import express from 'express';
import rateLimit from 'express-rate-limit';
import { listVoices, synthesize, plan } from '../controllers/ttsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Limite dédiée à la synthèse (appels vers un service externe) : 120 morceaux / 15 min par utilisateur
const ttsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de lectures demandées. Veuillez patienter un peu.' },
});

router.get('/voices', listVoices);
router.post('/plan', plan);
router.post('/', ttsLimiter, synthesize);

export default router;
