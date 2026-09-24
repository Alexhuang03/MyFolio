let ioInstance = null;

/**
 * Configure l'instance globale de Socket.IO
 * @param {import('socket.io').Server} io
 */
export const setIO = (io) => {
  ioInstance = io;
};

/**
 * Récupère l'instance globale Socket.IO
 * @returns {import('socket.io').Server | null}
 */
export const getIO = () => ioInstance;

/**
 * Émet un événement à tous les clients connectés dans la room d'un livre
 * @param {string} bookId - ID du livre
 * @param {string} event - Nom de l'événement
 * @param {any} data - Données associées
 */
export const emitToBook = (bookId, event, data) => {
  if (ioInstance && bookId) {
    ioInstance.to(`book:${bookId.toString()}`).emit(event, data);
  }
};

/**
 * Émet un événement à un utilisateur spécifique (sa room personnelle)
 * @param {string} userId - ID de l'utilisateur
 * @param {string} event - Nom de l'événement
 * @param {any} data - Données associées
 */
export const emitToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId.toString()}`).emit(event, data);
  }
};
