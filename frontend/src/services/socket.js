import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialise la connexion Socket.IO avec le token JWT
 * @param {string} token
 * @returns {import('socket.io-client').Socket}
 */
export const initSocket = (token) => {
  if (!token) return null;

  if (socket) {
    if (socket.connected) return socket;
    socket.disconnect();
  }

  socket = io({
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Erreur de connexion:', err.message);
  });

  return socket;
};

/**
 * Récupère l'instance socket courante
 * @returns {import('socket.io-client').Socket | null}
 */
export const getSocket = () => socket;

/**
 * Déconnecte le socket courant
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Rejoint la salle temps réel d'un livre
 * @param {string} bookId
 */
export const joinBookRoom = (bookId) => {
  if (socket && bookId) {
    socket.emit('join_book', bookId);
  }
};

/**
 * Quitte la salle temps réel d'un livre
 * @param {string} bookId
 */
export const leaveBookRoom = (bookId) => {
  if (socket && bookId) {
    socket.emit('leave_book', bookId);
  }
};
