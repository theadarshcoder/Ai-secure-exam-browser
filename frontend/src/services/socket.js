import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
    // 🛡️ Fix Bug 2.B: Persist exam room across page refreshes using sessionStorage
    this.currentExamRoom = sessionStorage.getItem('current_exam_room');
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
      reconnectionAttempts: 10, // Increased for stability
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected (authenticated)');
      
      const savedRoom = sessionStorage.getItem('current_exam_room');
      if (savedRoom) {
        console.log(`🔄 Re-joining exam room: ${savedRoom}`);
        this.socket.emit('join_exam_room', { examId: savedRoom });
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('🚫 Socket connection failed:', err.message);
      if (err.message.includes('Authentication') || err.message.includes('token') || err.message.includes('Session')) {
        toast.error(`Security Alert: ${err.message}. Redirecting to login...`);
        console.warn('🔑 Token expired/invalid — redirecting to login');
        sessionStorage.removeItem('vision_token');
        sessionStorage.removeItem('vision_role');
        window.location.href = '/login';
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('session_expired', (data) => {
      console.warn('🚦 Session Expired:', data.message);
      toast.error(data.message || 'Your session has expired. Please login again.');
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    });

    this.socket.on('force_logout', (data) => {
      console.warn('🔒 Force Logout:', data.message);
      toast.error(data.message || 'Security Alert: Account accessed from another device.', { duration: 6000 });
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitFlagSession(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('flag_session', data);
    }
  }

  emitViolation(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('student_violation', data);
    }
  }

  emitBroadcast(message, examId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mentor_broadcast', { message, examId });
    }
  }

  onBroadcast(callback) {
    if (this.socket) {
      this.socket.on('exam_broadcast', callback);
    }
  }

  onStudentHelp(callback) {
    if (this.socket) {
        this.socket.on('student_need_help', callback);
    }
  }

  onMentorAlert(callback) {
    if (this.socket) {
      this.socket.on('mentor_alert', callback);
    }
  }

  onCodeEvaluationResult(callback) {
    if (this.socket) {
      this.socket.on('code_evaluation_result', callback);
    }
  }

  onCodeEvaluationError(callback) {
    if (this.socket) {
      this.socket.on('code_evaluation_error', callback);
    }
  }

  // --- 🛡️ PROCTORING EMITS ---

  emitViolationReport(type, duration, examId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('violation_report', { type, duration, examId });
    }
  }

  blockStudent(studentId, examId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('block_student', { studentId, examId });
    }
  }

  unblockStudent(studentId, examId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unblock_student', { studentId, examId });
    }
  }

  sendWarningToast(studentId, message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_warning', { studentId, message });
    }
  }

  // 🛡️ Silent Re-Authentication (Bug Fix 5)
  reAuth(newToken) {
    if (this.socket && this.socket.connected) {
      console.log('🔄 Socket: Emitting re-auth with new token');
      this.socket.emit('re_auth', newToken);
    }
  }

  // --- 📨 ADMIN MESSAGING SYSTEM ---

  joinExamRoom(examId) {
    if (this.socket && this.socket.connected) {
      this.currentExamRoom = examId;
      sessionStorage.setItem('current_exam_room', examId); // Save to storage
      this.socket.emit('join_exam_room', { examId });
    }
  }

  emitAdminMessage(payload) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_admin_message', payload);
    }
  }

  emitMessageAck(messageId, studentId, examId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message_ack', { messageId, studentId, examId });
    }
  }

  onAdminMessage(callback) {
    if (this.socket) {
      this.socket.on('receive_admin_message', callback);
    }
  }

  offAdminMessage(callback) {
    if (this.socket) {
      this.socket.off('receive_admin_message', callback);
    }
  }

  onAckReceived(callback) {
    if (this.socket) {
      this.socket.on('ack_received', callback);
    }
  }

  offAckReceived(callback) {
    if (this.socket) {
      this.socket.off('ack_received', callback);
    }
  }
}

const socketService = new SocketService();
export default socketService;
