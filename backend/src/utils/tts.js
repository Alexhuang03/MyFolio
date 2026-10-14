import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cache disque des fichiers audio générés (hors de /uploads : non exposé publiquement)
export const TTS_CACHE_DIR = path.join(__dirname, '../../tts-cache');

const VOICES_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_TTS_TEXT_LENGTH = 1500;

let voicesCache = { list: null, fetchedAt: 0 };
const pendingSyntheses = new Map(); // Évite de générer deux fois le même audio en parallèle

// Le texte est inséré dans du SSML (XML) : il doit être échappé pour éviter toute injection de balises
const escapeXml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Liste des voix neuronales disponibles (mise en cache 24 h)
 */
export const getTtsVoices = async () => {
  if (voicesCache.list && Date.now() - voicesCache.fetchedAt < VOICES_TTL_MS) {
    return voicesCache.list;
  }
  const tts = new MsEdgeTTS();
  try {
    const voices = await tts.getVoices();
    const list = voices
      .filter((v) => v.ShortName.endsWith('Neural'))
      .map((v) => ({
        shortName: v.ShortName,
        locale: v.Locale,
        gender: v.Gender,
        name: v.ShortName.split('-').pop().replace(/(Multilingual)?Neural$/, ''),
        multilingual: v.ShortName.includes('Multilingual'),
      }));
    voicesCache = { list, fetchedAt: Date.now() };
    return list;
  } finally {
    tts.close();
  }
};

/**
 * Génère (ou récupère depuis le cache) le fichier MP3 d'un texte avec une voix donnée.
 * @returns {Promise<string>} chemin absolu du fichier MP3
 */
export const synthesizeToFile = async (text, voiceName) => {
  const key = crypto.createHash('sha256').update(`${voiceName}|${text}`).digest('hex');
  const filePath = path.join(TTS_CACHE_DIR, `${key}.mp3`);

  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    // Pas encore en cache
  }

  if (pendingSyntheses.has(key)) return pendingSyntheses.get(key);

  const job = (async () => {
    const tts = new MsEdgeTTS({ connectionTimeoutMs: 10000, synthesisTimeoutMs: 30000 });
    try {
      await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(escapeXml(text));
      const chunks = [];
      for await (const chunk of audioStream) chunks.push(chunk);
      const audio = Buffer.concat(chunks);
      if (audio.length === 0) throw new Error('Audio vide renvoyé par le service de synthèse');

      await fs.mkdir(TTS_CACHE_DIR, { recursive: true });
      // Écriture atomique : un fichier partiel ne doit jamais être servi depuis le cache
      const tmpPath = `${filePath}.${process.pid}.tmp`;
      await fs.writeFile(tmpPath, audio);
      await fs.rename(tmpPath, filePath);
      return filePath;
    } finally {
      tts.close();
      pendingSyntheses.delete(key);
    }
  })();

  pendingSyntheses.set(key, job);
  return job;
};
