import Book from '../models/Book.js';

/**
 * Détermine le niveau d'accès d'un utilisateur à un livre
 * @param {string} bookId - ID du livre
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Promise<{ hasAccess: boolean, book: any, role: 'owner' | 'editor' | 'viewer' | null, isOwner: boolean }>}
 */
export const getBookAccess = async (bookId, userId) => {
  if (!bookId || !userId) {
    return { hasAccess: false, book: null, role: null, isOwner: false };
  }

  const book = await Book.findById(bookId);
  if (!book) {
    return { hasAccess: false, book: null, role: null, isOwner: false };
  }

  const userIdStr = userId.toString();
  const ownerIdStr = book.userId.toString();

  // 1. Propriétaire du livre
  if (ownerIdStr === userIdStr) {
    return { hasAccess: true, book, role: 'owner', isOwner: true };
  }

  // 2. Collaborateur invité
  const collaborator = book.collaborators?.find(
    (c) => c.userId && c.userId.toString() === userIdStr
  );

  if (collaborator) {
    return {
      hasAccess: true,
      book,
      role: collaborator.role || 'viewer',
      isOwner: false,
    };
  }

  // 3. Aucun accès
  return { hasAccess: false, book: null, role: null, isOwner: false };
};
