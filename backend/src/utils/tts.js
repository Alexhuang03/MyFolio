import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cache disque des fichiers audio générés (hors de /uploads : non exposé publiquement)
export const TTS_CACHE_DIR = path.join(__dirname, '../../tts-cache');

const VOICES_TTL_MS = 24 * 60 * 60 * 1000;
const AZURE_TIMEOUT_MS = 20000;
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
 * Deux moteurs possibles, avec les mêmes voix neuronales (Denise, Emma, Ryan...) :
 * - Azure Speech (API officielle) si AZURE_SPEECH_KEY et AZURE_SPEECH_REGION sont définies : stable ;
 * - sinon le service non officiel de lecture à voix haute d'Edge (msedge-tts), que Microsoft peut bloquer.
 */
const azureConfig = () => {
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  return key && region ? { key, base: `https://${region}.tts.speech.microsoft.com/cognitiveservices` } : null;
};

const toVoice = (v) => ({
  shortName: v.ShortName,
  locale: v.Locale,
  gender: v.Gender,
  name: v.ShortName.split('-').pop().replace(/(Multilingual)?Neural$/, ''),
  multilingual: v.ShortName.includes('Multilingual'),
});

const fetchAzureVoices = async ({ key, base }) => {
  const res = await fetch(`${base}/voices/list`, {
    headers: { 'Ocp-Apim-Subscription-Key': key },
    signal: AbortSignal.timeout(AZURE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Azure Speech : liste des voix refusée (HTTP ${res.status})`);
  // Voix neuronales standard uniquement (les variantes « HD », nommées avec « : », sont exclues)
  return (await res.json()).filter((v) => v.VoiceType === 'Neural' && !v.ShortName.includes(':'));
};

const fetchEdgeVoices = async () => {
  const tts = new MsEdgeTTS();
  try {
    return (await tts.getVoices()).filter((v) => v.ShortName.endsWith('Neural'));
  } finally {
    tts.close();
  }
};

/**
 * Liste des voix neuronales disponibles (mise en cache 24 h)
 */
export const getTtsVoices = async () => {
  if (voicesCache.list && Date.now() - voicesCache.fetchedAt < VOICES_TTL_MS) {
    return voicesCache.list;
  }
  const azure = azureConfig();
  const list = (azure ? await fetchAzureVoices(azure) : await fetchEdgeVoices()).map(toVoice);
  voicesCache = { list, fetchedAt: Date.now() };
  return list;
};

const synthesizeWithAzure = async ({ key, base }, text, voiceName) => {
  const locale = voiceName.split('-').slice(0, 2).join('-');
  // voiceName a été vérifié contre la liste des voix par le contrôleur ; le texte est échappé
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}"><voice name="${voiceName}">${escapeXml(text)}</voice></speak>`;
  const res = await fetch(`${base}/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'MyFolio',
    },
    body: ssml,
    signal: AbortSignal.timeout(AZURE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Azure Speech : synthèse refusée (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
};

const synthesizeWithEdge = async (text, voiceName) => {
  const tts = new MsEdgeTTS({ connectionTimeoutMs: 10000, synthesisTimeoutMs: 30000 });
  try {
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(escapeXml(text));
    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);
    return Buffer.concat(chunks);
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
    try {
      const azure = azureConfig();
      const audio = azure ? await synthesizeWithAzure(azure, text, voiceName) : await synthesizeWithEdge(text, voiceName);
      if (audio.length === 0) throw new Error('Audio vide renvoyé par le service de synthèse');

      await fs.mkdir(TTS_CACHE_DIR, { recursive: true });
      // Écriture atomique : un fichier partiel ne doit jamais être servi depuis le cache
      const tmpPath = `${filePath}.${process.pid}.tmp`;
      await fs.writeFile(tmpPath, audio);
      await fs.rename(tmpPath, filePath);
      return filePath;
    } finally {
      pendingSyntheses.delete(key);
    }
  })();

  pendingSyntheses.set(key, job);
  return job;
};
