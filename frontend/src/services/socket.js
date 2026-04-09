import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://vision-o16g.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = sessionStorage.getItem('vision_token');

    if (!token) {
      console.warn('⚠️ Socket: No token found! Login first.');
      return null;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected (authenticated)');
    });

    this.socket.on('connect_error', (err) => {
      console.error('🚫 Socket connection failed:', err.message);
      if (err.message.includes('Authentication') || err.message.includes('token') || err.message.includes('Session')) {
        console.warn('🔑 Token expired/invalid — redirecting to login');
        sessionStorage.removeItem('vision_token');
        sessionStorage.removeItem('vision_role');
        window.location.href = '/login';
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitViolation(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('student_violation', data);
    }
  }

  onMentorAlert(callback) {
    if (this.socket) {
      this.socket.on('mentor_alert', callback);
    }
  }
}

const socketService = new SocketService();
export default socketService;
