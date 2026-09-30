import { io } from 'socket.io-client';

/**
 * Singleton Socket.IO client.
 * Connects with the JWT token from localStorage.
 */
let socket = null;

export const connectSocket = () => {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('freelancehub_token');
  if (!token) return null;

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io('/', {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket.IO] Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket.IO] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
