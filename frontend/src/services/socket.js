// ─────────────────────────────────────────────────────────
// socket.js — Socket.IO Service (JWT Authenticated)
// ─────────────────────────────────────────────────────────
// Ab socket connect karte waqt JWT token bhejte hain
// Backend pe Socket middleware token verify karega
// Bina valid token ke connection reject ho jayega

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  // Socket connect karo — ab JWT token bhi bhejte hain!
  connect() {
    // Agar pehle se connected hai toh skip karo
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // localStorage se JWT token lo
    const token = localStorage.getItem('vision_token');

    if (!token) {
      console.warn('⚠️ Socket: No token found! Login first.');
      return null;
    }

    // Socket connect karo WITH JWT token
    // Backend ka io.use() middleware isko verify karega
    this.socket = io(SOCKET_URL, {
      auth: { token },              // <-- Ye token backend pe socket.handshake.auth.token mein milega
      transports: ['websocket'],     // WebSocket use karo (polling se fast hai)
      reconnection: true,            // Disconnect hone pe auto-reconnect karo
      reconnectionAttempts: 5,       // Max 5 baar try karo
      reconnectionDelay: 2000,       // 2 second baad retry karo
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected (authenticated)');
    });

    this.socket.on('connect_error', (err) => {
      console.error('🚫 Socket connection failed:', err.message);
      // Agar token invalid hai toh user ko login page bhejo
      if (err.message.includes('Authentication') || err.message.includes('token') || err.message.includes('Session')) {
        console.warn('🔑 Token expired/invalid — redirecting to login');
        localStorage.removeItem('vision_token');
        localStorage.removeItem('vision_role');
        window.location.href = '/login';
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    return this.socket;
  }

  // Socket disconnect karo (logout ke waqt call karna)
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket manually disconnected');
    }
  }

  // ─── Student Functions ─────────────────────────────
  // Student ne violation kiya (tab switch, copy-paste, etc.)
  emitViolation(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('student_violation', data);
    } else {
      console.warn('⚠️ Socket not connected — violation not sent');
    }
  }

  // ─── Mentor Functions ──────────────────────────────
  // Mentor ko real-time alerts milenge jab student violation kare
  onMentorAlert(callback) {
    if (this.socket) {
      this.socket.on('mentor_alert', callback);
    }
  }

  // Generic event listener (kisi bhi event ke liye)
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Generic event emitter
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }
}

const socketService = new SocketService();
export default socketService;
