// Connects to Socket.IO server running on Developer 1's backend machine
// UPDATE 'http://localhost:3000' to Developer 1's LAN IP when testing on mobile devices over Wi-Fi
const SERVER_URL = 'http://localhost:3000';

// Global socket instance (using CDN loaded in index.html)
export const socket = window.io(SERVER_URL, {
  autoConnect: true,
  reconnection: true
});

/**
 * Join a specific order session room on the backend server
 * @param {string} orderId 
 */
export function joinOrderSession(orderId) {
  if (!orderId) return;

  if (socket.connected) {
    socket.emit('join_order_room', orderId);
  } else {
    socket.once('connect', () => {
      socket.emit('join_order_room', orderId);
    });
  }
}