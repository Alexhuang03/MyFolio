import { io } from 'socket.io-client';

let socket = null;
let currentBookId = null;

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
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Dès qu'on est connecté ou reconnecté, on ré-adhère automatiquement au livre actif s'il y en a un
  socket.on('connect', () => {
    if (currentBookId) {
      socket.emit('join_book', currentBookId);
    }
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
    currentBookId = null;
  }
};

/**
 * Rejoint la salle temps réel d'un livre
 * @param {string} bookId
 */
export const joinBookRoom = (bookId) => {
  if (!bookId) return;
  currentBookId = String(bookId);
  if (socket) {
    socket.emit('join_book', currentBookId);
  }
};

/**
 * Quitte la salle temps réel d'un livre
 * @param {string} bookId
 */
export const leaveBookRoom = (bookId) => {
  const bId = bookId ? String(bookId) : null;
  if (currentBookId === bId) {
    currentBookId = null;
  }
  if (socket && bId) {
    socket.emit('leave_book', bId);
  }
};
