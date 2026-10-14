import { getTtsVoices, synthesizeToFile, MAX_TTS_TEXT_LENGTH } from '../utils/tts.js';
import { planSpeech, MAX_PLAN_TEXT_LENGTH } from '../utils/speechPlanner.js';

// Découpage d'une description en passages avec leur langue (POST /api/tts/plan)
export const plan = (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ message: 'Texte requis' });
    }
    if (text.length > MAX_PLAN_TEXT_LENGTH) {
      return res.status(400).json({ message: `Texte trop long (${MAX_PLAN_TEXT_LENGTH} caractères maximum)` });
    }
    res.json({ chunks: planSpeech(text) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la préparation de la lecture', error: error.message });
  }
};

// Liste des voix (GET /api/tts/voices)
export const listVoices = async (req, res) => {
  try {
    const voices = await getTtsVoices();
    res.set('Cache-Control', 'private, max-age=86400');
    res.json(voices);
  } catch (error) {
    res.status(502).json({ message: 'Service de synthèse vocale indisponible', error: error.message });
  }
};

// Synthèse d'un texte (POST /api/tts) -> audio/mpeg
export const synthesize = async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (typeof text !== 'string' || !text.trim() || typeof voice !== 'string') {
      return res.status(400).json({ message: 'Texte et voix sont requis' });
    }
    if (text.length > MAX_TTS_TEXT_LENGTH) {
      return res.status(400).json({ message: `Texte trop long (${MAX_TTS_TEXT_LENGTH} caractères maximum)` });
    }

    // N'accepter qu'une voix réellement proposée par le service
    const voices = await getTtsVoices();
    if (!voices.some((v) => v.shortName === voice)) {
      return res.status(400).json({ message: 'Voix inconnue' });
    }

    const filePath = await synthesizeToFile(text.trim(), voice);
    res.set('Cache-Control', 'private, max-age=604800');
    res.type('audio/mpeg').sendFile(filePath);
  } catch (error) {
    res.status(502).json({ message: 'Échec de la synthèse vocale', error: error.message });
  }
};
