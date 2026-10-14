/**
 * Préparation de la lecture à voix haute :
 * - découpe la description en morceaux, chacun avec sa langue détectée
 * - mémorise la voix (et donc l'accent) choisie pour chaque langue
 */
import { stripMarkdown } from './markdown';

// Langues prises en charge (code franc ISO 639-3 -> code de langue) et voix par défaut
export const SPEECH_LANGUAGES = {
  fra: 'fr',
  eng: 'en',
  cmn: 'zh',
  jpn: 'ja',
  kor: 'ko',
  spa: 'es',
  ita: 'it',
  deu: 'de',
  por: 'pt',
  nld: 'nl',
  rus: 'ru',
  arb: 'ar',
};

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

const MAX_CHUNK_LENGTH = 1200; // Doit rester sous la limite du serveur (1500)
const MIN_DETECTION_LENGTH = 25; // En dessous, la détection statistique (franc) n'est pas fiable
// Séparateurs entre deux parties d'une ligne pouvant être en langues différentes
const SEGMENT_SEPARATORS = /\s+[-–—/|=→]\s+|\s*[()（）[\]]\s*|\s*[:：]\s+/;
const FALLBACK_LANG = 'fr'; // Seulement si le texte ne contient aucun mot reconnaissable (ex : « 400 g »)

// Caractères propres à une langue (accents, ponctuation)
const CHAR_HINTS = {
  fr: /[éèêàùçœ]/i,
  es: /[ñ¿¡]/i,
  de: /[äöüß]/i,
  pt: /[ãõ]/i,
};

/**
 * Langue d'un texte court d'après son vocabulaire : chaque mot connu vote pour sa langue
 * (vote partagé s'il existe dans plusieurs langues) ; un mot inconnu vote faiblement selon sa terminaison.
 */
const detectShortText = (text, { WORDS, ENDINGS }) => {
  const words = text.toLowerCase().match(/[a-zà-ÿœ]+/g) || [];
  if (words.length === 0) return null;

  const scores = {};
  const vote = (langs, weight) => langs.forEach((lang) => (scores[lang] = (scores[lang] || 0) + weight / langs.length));

  words.forEach((word) => {
    const known = Object.keys(WORDS).filter((lang) => WORDS[lang].has(word));
    if (known.length) return vote(known, 1);
    const byEnding = Object.keys(ENDINGS).filter((lang) => ENDINGS[lang].test(word));
    if (byEnding.length) vote(byEnding, 0.3);
  });
  Object.entries(CHAR_HINTS).forEach(([lang, regex]) => {
    if (regex.test(text)) vote([lang], 1.5);
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length || (ranked[1] && ranked[1][1] === ranked[0][1])) return null; // Égalité : indécidable
  return ranked[0][0];
};

const isCjkLang = (lang) => lang === 'zh' || lang === 'ja';

// Détection sans dépendance pour les écritures non latines (fiable même sur des textes très courts)
const detectByScript = (text) => {
  if (/[぀-ヿ]/.test(text)) return 'ja'; // Kana
  if (/[가-힯]/.test(text)) return 'ko'; // Hangul
  const han = (text.match(/[一-鿿]/g) || []).length;
  const latin = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  if (han > 0 && han >= latin / 2) return 'zh';
  return null;
};

// Ajoute une ponctuation finale pour marquer une pause entre les lignes (titres, éléments de liste...)
const withPause = (line, lang) => {
  if (/[.!?…:;。！？：；]$/.test(line)) return line;
  return line + (isCjkLang(lang) ? '。' : '.');
};

/**
 * Découpe une description Markdown en morceaux { text, lang } prêts à être lus.
 * Les lignes consécutives de même langue sont regroupées pour limiter le nombre de requêtes.
 */
export const buildSpeechChunks = async (markdown) => {
  const plain = stripMarkdown(markdown);
  if (!plain) return [];

  // Chargé à la demande : n'alourdit pas le chargement initial de l'application
  const [{ franc }, vocabulary] = await Promise.all([import('franc-min'), import('./speechWords')]);
  const only = Object.keys(SPEECH_LANGUAGES);
  // Langue d'un passage, déterminée uniquement par son contenu (jamais par la langue de l'interface)
  const detect = (text) => {
    const byScript = detectByScript(text);
    if (byScript) return byScript;
    if (text.length < MIN_DETECTION_LENGTH) return detectShortText(text, vocabulary);
    return (
      SPEECH_LANGUAGES[franc(text, { only, minLength: MIN_DETECTION_LENGTH })] || detectShortText(text, vocabulary)
    );
  };

  // Langue principale du texte : sert aux lignes trop courtes pour être reconnues seules (« 400 g de tofu »)
  const dominantLang = detect(plain) || FALLBACK_LANG;

  // Ajoute un passage à la liste, en le regroupant avec le précédent s'il est dans la même langue
  const chunks = [];
  const pushSegment = (text, lang) => {
    const sentence = withPause(text, lang);
    // Un passage très long est coupé aux fins de phrase
    const parts = sentence.length > MAX_CHUNK_LENGTH ? sentence.match(/[^.!?。！？]+[.!?。！？]*/g) : [sentence];
    parts.forEach((part) => {
      const prev = chunks[chunks.length - 1];
      if (prev && prev.lang === lang && prev.text.length + part.length < MAX_CHUNK_LENGTH) {
        prev.text += ` ${part.trim()}`;
      } else {
        chunks.push({ text: part.trim(), lang });
      }
    });
  };

  plain
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      // Une ligne peut mélanger plusieurs langues (« bonjour - hello », « poulet (chicken) ») :
      // chaque partie séparée par un tiret, une barre, une flèche, des parenthèses... est détectée à part
      // Découpage en conservant les séparateurs : [texte, séparateur, texte, séparateur, ...]
      const pieces = line.split(new RegExp(`(${SEGMENT_SEPARATORS.source})`));
      const segments = []; // { text, lang, after } : `after` = séparateur d'origine qui suit la partie
      let leading = '';
      pieces.forEach((piece, index) => {
        const isSeparator = index % 2 === 1;
        const last = segments[segments.length - 1];
        if (isSeparator) {
          if (last) last.after += piece;
          else leading += piece;
        } else if (/[\p{L}\p{N}]/u.test(piece)) {
          segments.push({ text: leading + piece, lang: detect(piece.trim()), after: '' });
          leading = '';
        } else if (last) {
          last.after += piece;
        }
      });

      // Les parties sans langue reconnaissable (« 400 g ») prennent celle de leur voisine, sinon la langue du texte
      const lineLang = detect(line) || dominantLang;
      segments.forEach((segment, index) => {
        if (segment.lang) return;
        const neighbour =
          segments.slice(0, index).reverse().find((s) => s.lang) || segments.slice(index + 1).find((s) => s.lang);
        segment.lang = neighbour?.lang || lineLang;
      });

      // Les parties consécutives de même langue sont recollées avec leur ponctuation d'origine :
      // seule une vraie bascule de langue crée une coupure (et donc une pause)
      const runs = [];
      segments.forEach((segment) => {
        const run = runs[runs.length - 1];
        if (run && run.lang === segment.lang) {
          run.text += run.pendingSeparator + segment.text;
        } else {
          runs.push({ text: segment.text, lang: segment.lang });
        }
        runs[runs.length - 1].pendingSeparator = segment.after;
      });
      runs.forEach((run, index) => {
        // Le séparateur final d'une ligne (ex : parenthèse fermante) est conservé
        const text = index === runs.length - 1 ? run.text + run.pendingSeparator : run.text;
        pushSegment(text.trim(), run.lang);
      });
    });
  return chunks;
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
