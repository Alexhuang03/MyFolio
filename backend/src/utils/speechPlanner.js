/**
 * Préparation de la lecture à voix haute : découpe une description Markdown en passages { text, lang }.
 *
 * La langue vient uniquement du contenu, jamais de la langue de l'interface :
 * - écritures non latines (chinois, japonais, coréen) reconnues par leurs caractères ;
 * - français / anglais départagés grâce à des dictionnaires complets : un mot qui n'existe que dans une
 *   des deux langues (« leaf », « feuille ») est une preuve fiable, même isolé ;
 * - autres langues (espagnol, allemand...) via un vocabulaire courant et une détection statistique ;
 * - le contexte tranche les mots ambigus (« bus », « tour ») : colonne d'un tableau, voisins, reste du texte.
 */
import { createRequire } from 'module';
import { franc } from 'franc-min';
import { stripMarkdown } from './markdown.js';
import { WORDS, ENDINGS, LANGUAGE_NAMES } from './speechWords.js';

const require = createRequire(import.meta.url);

// Langues prises en charge (code franc ISO 639-3 -> code de langue)
const SPEECH_LANGUAGES = {
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
const FRANC_ONLY = Object.keys(SPEECH_LANGUAGES);

export const MAX_PLAN_TEXT_LENGTH = 20000;
const MAX_CHUNK_LENGTH = 1200; // Doit rester sous la limite de synthèse (1500)
const MIN_DETECTION_LENGTH = 25; // En dessous, la détection statistique (franc) n'est pas fiable
const FALLBACK_LANG = 'fr'; // Seulement si le texte ne contient aucun mot reconnaissable (ex : « 400 g »)

// Séparateurs entre deux parties d'une ligne pouvant être en langues différentes
const SEGMENT_SEPARATORS = /\s+[-–—/|=→]\s+|\s*[()（）[\]]\s*|\s*[:：]\s+/;
// Séparateurs de « paires » (traductions, équivalences) : « Leaf - Feuille », « chat = cat », « 番茄 → tomato »
const PAIR_SEPARATORS = /\s+[-–—|=→]\s+|\s*[:：]\s+/;
// Ligne de séparation d'un tableau Markdown (|---|:---:|)
const TABLE_SEPARATOR_ROW = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
// Élisions françaises : l'eau, j'adore, qu'il...
const FRENCH_ELISION = /(?<![\p{L}])(?:l|d|j|m|n|s|t|c|qu|jusqu|lorsqu|puisqu)['’](?=\p{L})/giu;

// Unités et abréviations : n'indiquent aucune langue (« 30 min », « 2 tbsp », « 500 ml »)
const NEUTRAL_TOKENS = new Set(
  'g kg mg ml cl dl l min mn h hr hrs s sec cm mm m km oz lb lbs tbsp tsp pcs pc x cc kcal cal etc vs'.split(' ')
);

// Caractères propres à une langue (accents, ponctuation)
const CHAR_HINTS = {
  fr: /[éèêàùçœ]/i,
  es: /[ñ¿¡]/i,
  de: /[äöüß]/i,
  pt: /[ãõ]/i,
};

// Dictionnaires complets anglais / français (~45 Mo en mémoire), chargés à la première lecture
let dictionaries = null;
const getDictionaries = () => {
  if (!dictionaries) {
    dictionaries = {
      en: new Set(require('an-array-of-english-words')),
      fr: new Set(require('an-array-of-french-words')),
    };
  }
  return dictionaries;
};

const hasContent = (text) => /[\p{L}\p{N}]/u.test(text);
const isPairSeparator = (separator) => /^\s*[-–—|=→]\s*$/.test(separator);
const isCjkLang = (lang) => lang === 'zh' || lang === 'ja';

// Détection sans dépendance pour les écritures non latines (fiable même sur des textes très courts)
const detectByScript = (text) => {
  if (/[぀-ヿ]/.test(text)) return 'ja'; // Kana
  if (/[가-힯]/.test(text)) return 'ko'; // Hangul
  if (/[Ѐ-ӿ]/.test(text)) return 'ru'; // Cyrillique
  if (/[؀-ۿ]/.test(text)) return 'ar'; // Arabe
  const han = (text.match(/[一-鿿]/g) || []).length;
  const latin = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  if (han > 0 && han >= latin / 2) return 'zh';
  return null;
};

/**
 * Score de chaque langue pour un texte en écriture latine.
 * - mot du vocabulaire courant : 1 point, indice sûr (partagé s'il existe dans plusieurs langues)
 * - sinon, mot présent dans un seul des deux dictionnaires (anglais / français) : 0,6 point
 *   (indice plus faible : « tofu » ou « sushi » manquent au dictionnaire français sans être de l'anglais)
 * - mot présent dans les deux dictionnaires : quasi neutre
 * - mot inconnu : faible indice d'après sa terminaison
 * - ignorés : unités (« min », « kg ») et sigles en majuscules (« TODO », « USA »)
 */
const scoreText = (text) => {
  const { en, fr } = getDictionaries();
  const lower = text.toLowerCase();
  const scores = {};
  const vote = (langs, weight) =>
    langs.forEach((lang) => {
      scores[lang] = (scores[lang] || 0) + weight / langs.length;
    });

  const elisions = lower.match(FRENCH_ELISION) || [];
  if (elisions.length) vote(['fr'], elisions.length);
  const words = (text.replace(FRENCH_ELISION, ' ').match(/\p{L}+/gu) || [])
    .filter((word) => !(word.length >= 2 && word === word.toUpperCase())) // Sigles : TODO, USA, PS...
    .map((word) => word.toLowerCase())
    .filter((word) => !NEUTRAL_TOKENS.has(word));

  let decisive = 0; // Mots qui désignent clairement le français ou l'anglais
  words.forEach((word) => {
    const curated = Object.keys(WORDS).filter((lang) => WORDS[lang].has(word));
    if (curated.length) {
      vote(curated, 1);
      if (curated.length === 1 && (curated[0] === 'en' || curated[0] === 'fr')) decisive += 1;
      return;
    }
    const inEn = en.has(word);
    const inFr = fr.has(word);
    if (inEn !== inFr) {
      vote([inEn ? 'en' : 'fr'], 0.6);
      decisive += 1;
    } else if (inEn && inFr) {
      vote(['en', 'fr'], 0.2);
    } else {
      const byEnding = Object.keys(ENDINGS).filter((lang) => ENDINGS[lang].test(word));
      if (byEnding.length) vote(byEnding, 0.3);
    }
  });
  Object.entries(CHAR_HINTS).forEach(([lang, regex]) => {
    if (regex.test(text)) vote([lang], 1.5);
  });

  return { scores, wordCount: words.length, decisive };
};

/**
 * Langue d'un passage et force de l'indice ({ lang, score, sure }), lang = null si le contenu ne permet pas
 * de trancher (le contexte décidera). `sure` : écriture non latine, détection statistique ou score >= 1.
 */
const detectWithScore = (text) => {
  const byScript = detectByScript(text);
  if (byScript) return { lang: byScript, score: Infinity, sure: true };

  const { scores, wordCount, decisive } = scoreText(text);
  if (!wordCount) return { lang: null, score: 0, sure: false };

  // Autres langues (espagnol, allemand, italien...) : détection statistique sur les textes assez longs,
  // retenue seulement si le texte n'est visiblement ni français ni anglais
  if (text.length >= MIN_DETECTION_LENGTH && decisive / wordCount < 0.3) {
    const statistical = SPEECH_LANGUAGES[franc(text, { only: FRANC_ONLY, minLength: MIN_DETECTION_LENGTH })];
    if (statistical && statistical !== 'en' && statistical !== 'fr') {
      return { lang: statistical, score: Infinity, sure: true };
    }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  if (!top || top[1] < 0.5) return { lang: null, score: 0, sure: false }; // Trop peu d'indices
  if (second && top[1] - second[1] < 0.25) return { lang: null, score: 0, sure: false }; // Indécidable
  return { lang: top[0], score: top[1], sure: top[1] >= 1 };
};

const detect = (text) => detectWithScore(text).lang;

// Ajoute une ponctuation finale pour marquer une pause entre les lignes (titres, éléments de liste...)
const withPause = (line, lang) => {
  if (/[.!?…:;。！？：；]$/.test(line)) return line;
  return line + (isCjkLang(lang) ? '。' : '.');
};

const splitTableRow = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => stripMarkdown(cell.trim()));

/**
 * Découpe le Markdown en blocs : tableaux (cellules conservées) et lignes de texte.
 * Plusieurs lignes consécutives de la forme « A - B » (même nombre de parties) forment aussi une grille.
 */
const parseBlocks = (markdown) => {
  const blocks = [];
  let textLines = [];

  const flushText = () => {
    const lines = stripMarkdown(textLines.join('\n'))
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    textLines = [];

    let group = [];
    const flushGroup = () => {
      if (group.length >= 2) {
        blocks.push({ type: 'grid', header: null, rows: group.map((g) => g.parts), lines: group.map((g) => g.line) });
      } else {
        group.forEach((g) => blocks.push({ type: 'line', text: g.line }));
      }
      group = [];
    };
    lines.forEach((line) => {
      const parts = line
        .split(PAIR_SEPARATORS)
        .map((part) => part.trim())
        .filter(hasContent);
      if (parts.length >= 2 && (!group.length || group[0].parts.length === parts.length)) {
        group.push({ line, parts });
        return;
      }
      flushGroup();
      if (parts.length >= 2) group.push({ line, parts });
      else blocks.push({ type: 'line', text: line });
    });
    flushGroup();
  };

  const lines = markdown.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].includes('|') && TABLE_SEPARATOR_ROW.test(lines[i + 1] || '')) {
      flushText();
      const header = splitTableRow(lines[i]);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      blocks.push({ type: 'grid', header, rows });
    } else {
      textLines.push(lines[i]);
    }
  }
  flushText();
  return blocks;
};

/**
 * Découpe une description Markdown en passages { text, lang } prêts à être lus.
 */
export const planSpeech = (markdown) => {
  if (!stripMarkdown(markdown)) return [];

  const blocks = parseBlocks(markdown);

  // Langues présentes dans le texte (sert à deviner la langue d'un passage ambigu)
  const langCounts = {};
  const count = (lang) => {
    if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1;
  };
  blocks.forEach((block) => {
    if (block.type === 'line') count(detect(block.text));
    else block.rows.flat().forEach((cell) => count(detect(cell)));
  });
  const rankedLangs = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a]);
  const dominantLang = rankedLangs[0] || FALLBACK_LANG;
  // Dans une paire « inconnu - connu », le mot inconnu est le plus probablement dans l'autre langue du texte
  // (à défaut d'autre langue présente : français <-> anglais, le cas le plus courant)
  const otherLang = (lang) => rankedLangs.find((l) => l !== lang) || (lang === 'en' ? 'fr' : 'en');

  // Dans un texte suivi, on ne quitte la langue principale que sur un indice sûr :
  // « 400 g de tofu » reste en français dans une recette française, « (chicken) » passe en anglais
  const detectInContext = (text) => {
    const { lang, sure } = detectWithScore(text);
    if (lang && lang !== dominantLang && !sure) return null;
    return lang;
  };

  /**
   * Langue d'une colonne : nom de langue en en-tête, sinon vote des cellules + détection sur toute la colonne.
   * `support` = part des cellules reconnues individuellement dans cette langue (fiabilité du résultat).
   */
  const detectColumn = (headerCell, cells, hasWords) => {
    const named = headerCell && LANGUAGE_NAMES.get(headerCell.trim().toLowerCase());
    if (named) return { lang: named, support: 1 };
    const cellLangs = cells.map((cell) => detect(cell));
    const votes = {};
    const vote = (lang, weight) => {
      if (lang) votes[lang] = (votes[lang] || 0) + weight;
    };
    cellLangs.forEach((lang) => vote(lang, 1));
    // Détection sur toute la colonne seulement si elle contient de vrais mots
    // (sinon « 15 min », « 30 min »... cumuleraient de faux indices)
    if (hasWords) vote(detect(cells.join('. ')), 2);
    const lang = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const support = lang && cells.length ? cellLangs.filter((l) => l === lang).length / cells.length : 0;
    return { lang, support };
  };

  /**
   * Langues des colonnes d'une grille. Dans un tableau de traduction, deux colonnes ne sont presque jamais
   * dans la même langue : une colonne mal étayée qui reprend la langue d'une colonne plus sûre
   * reçoit l'autre langue du texte.
   */
  const detectColumnLangs = (header, rows) => {
    const width = Math.max(header?.length || 0, ...rows.map((row) => row.length));
    const columns = Array.from({ length: width }, (_, c) => {
      const cells = rows.map((row) => row[c]).filter((cell) => cell && hasContent(cell));
      // Colonne faite de vrais mots (et pas seulement de quantités : « 200 g », « 30 min »)
      const hasWords = cells.filter((cell) => /\p{L}{4,}/u.test(cell)).length >= cells.length / 2;
      return { hasWords, ...detectColumn(header?.[c], cells, hasWords) };
    });
    const used = new Set();
    [...columns]
      .sort((a, b) => b.support - a.support)
      .forEach((column) => {
        const isWeakDuplicate = column.lang && used.has(column.lang) && column.support < 0.5;
        const isUnknownWords = !column.lang && column.hasWords && used.size > 0;
        if (isWeakDuplicate || isUnknownWords) {
          const alternative = [...rankedLangs, ...[...used].map(otherLang)].find((l) => !used.has(l));
          if (alternative) column.lang = alternative;
        }
        if (column.lang) used.add(column.lang);
      });
    return columns.map((column) => column.lang);
  };

  // Ajoute un passage à la liste, en le regroupant avec le précédent s'il est dans la même langue
  const chunks = [];
  const pushSegment = (rawText, lang) => {
    // « A / B » et « A | B » : marquer une pause plutôt que de lire « slash »
    const text = rawText.replace(/\s+\/\s+/g, ', ').replace(/\s*\|\s*/g, ', ').trim();
    if (!hasContent(text)) return;
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

  const readLine = (line) => {
    // Une ligne peut mélanger plusieurs langues (« bonjour - hello », « poulet (chicken) ») :
    // chaque partie séparée par un tiret, une barre, une flèche, des parenthèses... est détectée à part.
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
      } else if (hasContent(piece)) {
        segments.push({ text: leading + piece, lang: detectInContext(piece.trim()), after: '' });
        leading = '';
      } else if (last) {
        last.after += piece;
      }
    });

    // Une partie sans langue reconnaissable prend :
    // - l'autre langue du texte si elle est liée à sa voisine par un séparateur de paire (« Leaf - Feuille »)
    // - sinon la langue de sa voisine (« 400 g », « (about 2 minutes) »), ou à défaut celle du texte
    //   (une partie en alphabet latin ne prend pas la langue d'une voisine chinoise ou japonaise)
    const lineLang = detectInContext(line) || dominantLang;
    // Langue de la ligne sans ses caractères chinois / japonais / coréens, pour les parties en alphabet latin
    const latinLineLang =
      detectInContext(line.replace(/[぀-ヿ一-鿿가-힯]+/g, ' ')) || dominantLang;
    segments.forEach((segment, index) => {
      if (segment.lang) return;
      const prev = segments[index - 1];
      const next = segments[index + 1];
      if (prev?.lang && isPairSeparator(prev.after)) segment.lang = otherLang(prev.lang);
      else if (next?.lang && isPairSeparator(segment.after)) segment.lang = otherLang(next.lang);
    });
    segments.forEach((segment, index) => {
      if (segment.lang) return;
      const canBorrow = (s) => s.lang && (!detectByScript(s.text) || detectByScript(segment.text));
      const neighbour =
        segments.slice(0, index).reverse().find(canBorrow) || segments.slice(index + 1).find(canBorrow);
      segment.lang = neighbour?.lang || (detectByScript(segment.text) ? lineLang : latinLineLang);
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
  };

  const readGrid = ({ header, rows, lines }) => {
    const columnLangs = detectColumnLangs(header, rows);
    // Une liste « A - B » dont toutes les colonnes sont dans la même langue n'est pas une liste de traductions :
    // elle est lue comme du texte normal (sans pause artificielle au milieu de chaque ligne)
    if (lines && new Set(columnLangs.filter(Boolean)).size < 2) {
      lines.forEach(readLine);
      return;
    }
    // En-tête : chaque titre est lu dans sa propre langue (« Anglais » est un mot français) ;
    // un titre ambigu prend la langue de l'ensemble de l'en-tête (« Mot | Traduction »)
    const headerLang = header && detect(header.join(' '));
    header?.forEach((cell) => {
      if (hasContent(cell)) pushSegment(cell, detect(cell) || headerLang || dominantLang);
    });
    rows.forEach((row) =>
      row.forEach((cell, c) => {
        if (!hasContent(cell)) return;
        // Une écriture non latine (chinois, japonais...) l'emporte ; sinon la langue de la colonne fait foi
        pushSegment(cell, detectByScript(cell) || columnLangs[c] || detect(cell) || dominantLang);
      })
    );
  };

  blocks.forEach((block) => (block.type === 'grid' ? readGrid(block) : readLine(block.text)));
  return chunks;
};
