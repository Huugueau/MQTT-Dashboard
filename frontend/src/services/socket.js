import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // event → callback
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    this.socket.on('connect', () => console.log('✓ Socket connecté'));
    this.socket.on('disconnect', () => console.log('✗ Socket déconnecté'));
    this.socket.on('connect_error', (e) => console.error('Erreur socket:', e));

    // Re-attach any listeners that were registered before connect()
    this.listeners.forEach((callback, event) => {
      this.socket.on(event, callback);
    });
  }

  on(event, callback) {
    // Remove the previous listener for this event before adding the new one
    // This prevents duplicate listeners on re-renders
    if (this.listeners.has(event) && this.socket) {
      this.socket.off(event, this.listeners.get(event)); // pass old ref to off()
    }

    this.listeners.set(event, callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    const callback = this.listeners.get(event);
    if (callback && this.socket) {
      this.socket.off(event, callback); // pass ref so only this listener is removed
    }
    this.listeners.delete(event);
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
