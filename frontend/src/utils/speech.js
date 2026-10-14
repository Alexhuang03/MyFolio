/**
 * Lecture à voix haute : voix par défaut et voix préférées (une par langue, donc l'accent).
 * Le découpage du texte et la détection des langues sont faits par le serveur (POST /api/tts/plan),
 * qui dispose de dictionnaires complets trop lourds pour le navigateur.
 */

export const DEFAULT_VOICES = {
  fr: 'fr-FR-DeniseNeural',
  en: 'en-US-EmmaNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
  ja: 'ja-JP-NanamiNeural',
  ko: 'ko-KR-SunHiNeural',
  es: 'es-ES-ElviraNeural',
  it: 'it-IT-ElsaNeural',
  de: 'de-DE-KatjaNeural',
  pt: 'pt-BR-FranciscaNeural',
  nl: 'nl-NL-ColetteNeural',
  ru: 'ru-RU-SvetlanaNeural',
  ar: 'ar-SA-ZariyahNeural',
};

// --- Voix préférées (une par langue), mémorisées sur l'appareil ---
const PREFS_KEY = 'myfolio-tts-voices';

export const getVoicePrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
};

export const setVoicePref = (lang, voice) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...getVoicePrefs(), [lang]: voice }));
  } catch {
    // Stockage indisponible (navigation privée...) : la préférence ne sera simplement pas retenue
  }
};

/**
 * Voix à utiliser pour une langue : préférence de l'utilisateur, sinon voix par défaut,
 * sinon première voix disponible pour cette langue.
 */
export const resolveVoice = (lang, voices = []) => {
  const available = new Set(voices.map((v) => v.shortName));
  const candidates = [getVoicePrefs()[lang], DEFAULT_VOICES[lang]].filter(Boolean);
  const found = candidates.find((name) => !voices.length || available.has(name));
  return found || voices.find((v) => v.locale.startsWith(`${lang}-`))?.shortName || null;
};
