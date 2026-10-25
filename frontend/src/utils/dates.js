// Langue de l'interface -> locale pour Intl
export const LOCALES = { fr: 'fr-FR', en: 'en-US', zh: 'zh-CN' };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// 'AAAA-MM-JJ' -> Date locale (sans décalage de fuseau), sinon null
export const parseIsoDate = (value) => {
  const match = ISO_DATE.exec(value?.trim() || '');
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d ? date : null;
};

export const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Affichage d'une date saisie : une date AAAA-MM-JJ est écrite dans la langue de l'interface
 * (« 12 mai 2024 ») ; tout autre texte (« Printemps 2023 ») est affiché tel quel.
 */
export const formatDisplayDate = (value, lang) => {
  const date = parseIsoDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(LOCALES[lang] || lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};
