/**
 * Convertit un texte Markdown en texte brut lisible.
 * Utilisé pour les aperçus courts (cartes, panier) et pour la lecture à voix haute.
 */
export const stripMarkdown = (markdown = '') =>
  markdown
    .replace(/```[^\n]*\n?([\s\S]*?)```/g, '$1') // Blocs de code : garder le contenu
    .replace(/`([^`]+)`/g, '$1') // Code en ligne
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // Images : garder le texte alternatif
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // Liens : garder le libellé
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // Titres
    .replace(/^\s{0,3}>\s?/gm, '') // Citations
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '') // Cases à cocher
    .replace(/^\s*[-*+]\s+/gm, '') // Listes à puces
    .replace(/^\s*(\d+)[.)]\s+/gm, '$1. ') // Listes numérotées
    .replace(/^\s*([-*_]\s*){3,}$/gm, '') // Séparateurs horizontaux
    .replace(/^\s*\|?[\s:-]+\|[\s|:-]*$/gm, '') // Ligne de séparation des tableaux
    .replace(/\|/g, ' ') // Cellules de tableau
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // Gras
    .replace(/(\*|_)(.+?)\1/g, '$2') // Italique
    .replace(/~~(.+?)~~/g, '$1') // Barré
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
