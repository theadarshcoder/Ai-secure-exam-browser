import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        query: { userId },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to socket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Student specific
  emitViolation(data) {
    if (this.socket) {
      this.socket.emit('student_violation', data);
    }
  }

  // Mentor specific
  onMentorAlert(callback) {
    if (this.socket) {
      this.socket.on('mentor_alert', callback);
    }
  }
}

const socketService = new SocketService();
export default socketService;
