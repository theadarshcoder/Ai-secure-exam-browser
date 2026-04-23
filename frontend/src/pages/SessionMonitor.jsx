import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Camera, Monitor, Shield, ShieldAlert, AlertTriangle,
  Eye, EyeOff, Clock, Activity, Wifi, WifiOff, Zap,
  Volume2, VolumeX, Mic, MicOff, Maximize2, Minimize2,
  OctagonX, Flag, MessageSquare, ChevronRight, ChevronDown,
  User, BookOpen, BarChart3, Radio, Send, X, CheckCircle2,
  Mouse, Keyboard, Globe, FileWarning, Brain, Cpu, Lock as LockIcon
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import socketService from '../services/socket';
import AdminMessageControls from '../components/AdminMessageControls';
import AdminHealthCockpit from '../components/AdminHealthCockpit';

/* ─────────────── Simulated Activity Log Generator ─────────────── */

const ACTIVITY_TYPES = [
  { type: 'gaze', icon: Eye, label: 'Gaze tracking', color: 'text-blue-400', bg: 'bg-blue-500/10', severity: 'low' },
  { type: 'mouse', icon: Mouse, label: 'Mouse activity', color: 'text-zinc-400', bg: 'bg-zinc-500/10', severity: 'info' },
  { type: 'keyboard', icon: Keyboard, label: 'Keystroke detected', color: 'text-zinc-400', bg: 'bg-zinc-500/10', severity: 'info' },
  { type: 'face', icon: User, label: 'Face detection', color: 'text-emerald-400', bg: 'bg-emerald-500/10', severity: 'low' },
  { type: 'tab', icon: Globe, label: 'Tab switch attempt', color: 'text-amber-400', bg: 'bg-amber-500/10', severity: 'medium' },
  { type: 'noise', icon: Volume2, label: 'Audio spike detected', color: 'text-amber-400', bg: 'bg-amber-500/10', severity: 'medium' },
  { type: 'multi_face', icon: AlertTriangle, label: 'Multiple faces detected', color: 'text-red-400', bg: 'bg-red-500/10', severity: 'high' },
  { type: 'phone', icon: FileWarning, label: 'Phone detected in frame', color: 'text-red-400', bg: 'bg-red-500/10', severity: 'high' },
  { type: 'help', icon: MessageSquare, label: 'Support requested', color: 'text-emerald-400', bg: 'bg-emerald-500/10', severity: 'high' },
];

const generateInitialLogs = () => {
  const logs = [];
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const activity = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
    logs.push({
      id: `log-${i}`,
      ...activity,
      timestamp: new Date(now - (i * 15000 + Math.random() * 10000)).toISOString(),
      detail: getRandomDetail(activity.type),
    });
  }
  return logs;
};

function getRandomDetail(type) {
  const details = {
    gaze: ['Looking at screen center', 'Eyes focused on question area', 'Brief look away (0.8s)', 'Steady gaze — normal range'],
    mouse: ['Cursor moved to option B', 'Scroll event on question panel', 'Hovering over submit area', 'Idle for 4 seconds'],
    keyboard: ['Typing in answer field', 'Backspace × 3', 'Tab key press', 'Copy shortcut blocked'],
    face: ['Single face confirmed', 'Face centered in frame', 'Face position: normal', 'Expression: neutral'],
    tab: ['Alt+Tab blocked', 'Browser tab switch attempt', 'Devtools shortcut blocked', 'Right-click blocked'],
    noise: ['Ambient noise: 42dB', 'Voice detected briefly', 'Background conversation', 'Noise spike: 68dB'],
    multi_face: ['2 faces detected in frame', 'Additional face at edge', 'Person behind candidate', 'Secondary face — 3.2s duration'],
    phone: ['Rectangular object detected', 'Phone-like device in view', 'Mobile screen reflection', 'Handheld device flagged'],
  };
  const arr = details[type] || ['Activity logged'];
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─────────────── Animated Canvas — Simulated Screen Feed ─────────────── */

const SimulatedScreen = () => {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 400;

    const draw = () => {
      const t = frameRef.current;

      // Background — exam interface simulation
      ctx.fillStyle = '#f8f9fb';
      ctx.fillRect(0, 0, 640, 400);

      // Header bar
      const grad = ctx.createLinearGradient(0, 0, 640, 0);
      grad.addColorStop(0, '#1a1d2e');
      grad.addColorStop(1, '#252840');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 36);

      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('VISION EXAM — Data Structures', 16, 24);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      const mins = Math.floor((t / 60) % 60);
      const secs = Math.floor(t % 60);
      ctx.fillText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} elapsed`, 530, 24);

      // Question card
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.06)';
      ctx.shadowBlur = 12;
      roundRect(ctx, 24, 52, 592, 200, 12);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      roundRect(ctx, 24, 52, 592, 200, 12);
      ctx.stroke();

      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.fillText('QUESTION 7 OF 30', 44, 80);

      ctx.fillStyle = '#1e293b';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText('What is the time complexity of inserting an element', 44, 108);
      ctx.fillText('at the beginning of a singly linked list?', 44, 126);

      // Options
      const options = ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'];
      const selectedIdx = Math.floor(t / 8) % 4;
      options.forEach((opt, i) => {
        const y = 150 + i * 26;
        const isSelected = i === selectedIdx;

        ctx.fillStyle = isSelected ? '#eef2ff' : '#f8fafc';
        roundRect(ctx, 44, y, 552, 22, 6);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#6366f1' : '#e2e8f0';
        ctx.lineWidth = isSelected ? 1.5 : 0.5;
        roundRect(ctx, 44, y, 552, 22, 6);
        ctx.stroke();

        // Radio circle
        ctx.beginPath();
        ctx.arc(60, y + 11, 5, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? '#6366f1' : '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(60, y + 11, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#6366f1';
          ctx.fill();
        }

        ctx.fillStyle = isSelected ? '#4338ca' : '#475569';
        ctx.font = `${isSelected ? 'bold ' : ''}12px Inter, system-ui, sans-serif`;
        ctx.fillText(`${String.fromCharCode(65 + i)}) ${opt}`, 76, y + 15);
      });

      // Sidebar question palette
      ctx.fillStyle = '#f1f5f9';
      roundRect(ctx, 24, 268, 592, 116, 12);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      roundRect(ctx, 24, 268, 592, 116, 12);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.fillText('QUESTION NAVIGATOR', 44, 292);

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 15; c++) {
          const qNum = r * 15 + c + 1;
          const qx = 44 + c * 37;
          const qy = 302 + r * 24;
          const answered = qNum <= 6;
          const current = qNum === 7;

          ctx.fillStyle = current ? '#6366f1' : answered ? '#d1fae5' : '#ffffff';
          roundRect(ctx, qx, qy, 32, 20, 4);
          ctx.fill();
          ctx.strokeStyle = current ? '#6366f1' : answered ? '#6ee7b7' : '#e2e8f0';
          ctx.lineWidth = 0.5;
          roundRect(ctx, qx, qy, 32, 20, 4);
          ctx.stroke();

          ctx.fillStyle = current ? '#ffffff' : answered ? '#065f46' : '#94a3b8';
          ctx.font = `${current ? 'bold ' : ''}9px monospace`;
          ctx.fillText(String(qNum).padStart(2, '0'), qx + 9, qy + 14);
        }
      }

      // Simulated cursor
      const cursorX = 300 + Math.sin(t * 0.3) * 120;
      const cursorY = 180 + Math.cos(t * 0.2) * 40;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(cursorX, cursorY);
      ctx.lineTo(cursorX, cursorY + 14);
      ctx.lineTo(cursorX + 5, cursorY + 10);
      ctx.closePath();
      ctx.fill();

      frameRef.current += 0.05;
      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full object-cover rounded-xl" />;
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ─────────────── Simulated Webcam Feed ─────────────── */

const SimulatedWebcam = ({ risk }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 320;
    canvas.height = 240;

    const draw = () => {
      const t = frameRef.current;

      // Dark background simulating a room
      const bg = ctx.createRadialGradient(160, 120, 40, 160, 120, 200);
      bg.addColorStop(0, '#2a2d3a');
      bg.addColorStop(1, '#14161e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 320, 240);

      // Screen glow on face
      const glow = ctx.createRadialGradient(160, 100, 20, 160, 100, 100);
      glow.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 320, 240);

      // Head silhouette (oval)
      const headX = 160 + Math.sin(t * 0.15) * 3;
      const headY = 95 + Math.cos(t * 0.12) * 2;
      ctx.fillStyle = '#d4a574';
      ctx.beginPath();
      ctx.ellipse(headX, headY, 32, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.ellipse(headX, headY - 18, 34, 28, 0, -Math.PI, 0);
      ctx.fill();

      // Eyes
      const eyeOffsetX = Math.sin(t * 0.2) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(headX - 10, headY - 4, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headX + 10, headY - 4, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.arc(headX - 10 + eyeOffsetX, headY - 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX + 10 + eyeOffsetX, headY - 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.strokeStyle = '#b88a64';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(headX, headY + 12, 6, 0.1, Math.PI - 0.1);
      ctx.stroke();

      // Shoulders/body
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.ellipse(headX, headY + 80, 55, 35, 0, -Math.PI, 0);
      ctx.fill();

      // Shirt collar
      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.moveTo(headX - 15, headY + 38);
      ctx.lineTo(headX, headY + 50);
      ctx.lineTo(headX + 15, headY + 38);
      ctx.fill();

      // Screen reflection on face
      ctx.fillStyle = 'rgba(99,102,241,0.04)';
      ctx.fillRect(0, 0, 320, 240);

      // Face detection box
      const boxColor = risk === 'High' ? 'rgba(239,68,68,0.7)' : risk === 'Medium' ? 'rgba(245,158,11,0.6)' : 'rgba(52,211,153,0.5)';
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      roundRect(ctx, headX - 40, headY - 48, 80, 100, 6);
      ctx.stroke();
      ctx.setLineDash([]);

      // Face detection label
      ctx.fillStyle = boxColor;
      ctx.font = 'bold 8px monospace';
      ctx.fillText('FACE: DETECTED', headX - 36, headY - 52);

      // Confidence score
      const conf = 94 + Math.sin(t * 0.5) * 4;
      ctx.fillText(`CONF: ${conf.toFixed(1)}%`, headX + 4, headY + 58);

      // Noise indicator at bottom
      for (let i = 0; i < 40; i++) {
        const barH = Math.abs(Math.sin(t * 0.8 + i * 0.5)) * 12 + 2;
        ctx.fillStyle = barH > 10 ? 'rgba(245,158,11,0.5)' : 'rgba(99,102,241,0.25)';
        ctx.fillRect(8 + i * 7.5, 230 - barH, 4, barH);
      }

      // Timestamp overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      roundRect(ctx, 6, 6, 90, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '9px monospace';
      ctx.fillText(`REC ● ${new Date().toLocaleTimeString()}`, 12, 18);

      frameRef.current += 0.05;
      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [risk]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover rounded-xl" />;
};

/* ─────────────── Metric Sparkline ─────────────── */

const Sparkline = ({ data, color = '#6366f1', height = 28 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="2" fill={color} />
    </svg>
  );
};

/* ─────────────── Main Component ─────────────── */

export default function SessionMonitor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get session data from URL params
  const sessionData = {
    id: searchParams.get('id') || '',
    name: searchParams.get('name') || 'Unknown Student',
    exam: searchParams.get('exam') || 'General Exam',
    examId: searchParams.get('examId') || searchParams.get('id') || '',
    risk: searchParams.get('risk') || 'Low',
    score: parseInt(searchParams.get('score') || '90'),
    time: searchParams.get('time') || '30m rem',
  };

  const [activityLogs, setActivityLogs] = useState(generateInitialLogs);
  const [isConnected, setIsConnected] = useState(true);
  const [isBlocked, setIsBlocked] = useState(searchParams.get('status') === 'blocked');
  const [elapsedTime, setElapsedTime] = useState(0);

  const [selectedLogFilter, setSelectedLogFilter] = useState('all');
  const [screenExpanded, setScreenExpanded] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Risk metrics with sparkline data
  const [metrics, setMetrics] = useState(() => ({
    trustScore: { value: sessionData.score, history: Array.from({ length: 20 }, () => 70 + Math.random() * 30) },
    gazeDeviation: { value: 12, history: Array.from({ length: 20 }, () => Math.random() * 35) },
    audioLevel: { value: 28, history: Array.from({ length: 20 }, () => 20 + Math.random() * 30) },
    tabSwitches: { value: 0, history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 3)) },
  }));

  // Elapsed time ticker
  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate new activity logs
  useEffect(() => {
    const interval = setInterval(() => {
      const activity = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
      const newLog = {
        id: `log-${Date.now()}`,
        ...activity,
        timestamp: new Date().toISOString(),
        detail: getRandomDetail(activity.type),
      };
      setActivityLogs(prev => [newLog, ...prev].slice(0, 50));

      // Update metrics
      setMetrics(prev => ({
        trustScore: {
          value: Math.max(40, Math.min(100, prev.trustScore.value + (Math.random() > 0.3 ? 1 : -2))),
          history: [...prev.trustScore.history.slice(1), prev.trustScore.value],
        },
        gazeDeviation: {
          value: Math.max(0, Math.min(45, prev.gazeDeviation.value + (Math.random() - 0.5) * 8)),
          history: [...prev.gazeDeviation.history.slice(1), prev.gazeDeviation.value],
        },
        audioLevel: {
          value: Math.max(15, Math.min(70, prev.audioLevel.value + (Math.random() - 0.5) * 10)),
          history: [...prev.audioLevel.history.slice(1), prev.audioLevel.value],
        },
        tabSwitches: {
          value: prev.tabSwitches.value + (Math.random() > 0.95 ? 1 : 0),
          history: [...prev.tabSwitches.history.slice(1), prev.tabSwitches.value],
        },
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // REAL-TIME HELP LISTENER
  useEffect(() => {
    socketService.connect();
    socketService.onStudentHelp((data) => {
      // Only show if it's for this specific student/exam
      if (data.studentId === sessionData.id || data.studentEmail === sessionData.email) {
        const helpLog = {
          id: `help-${Date.now()}`,
          type: 'help',
          icon: MessageSquare,
          label: 'Student Help Requested',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          severity: 'high',
          timestamp: new Date().toISOString(),
          detail: data.message || 'Needs intervention',
        };
        setActivityLogs(prev => [helpLog, ...prev.slice(0, 49)]);
      }
    });

    return () => { /* socket service disconnect handled globally or by context if needed */ };
  }, [sessionData.id, sessionData.email]);

  // Connection flicker simulation
  useEffect(() => {
    const flicker = setInterval(() => {
      if (Math.random() > 0.95) {
        setIsConnected(false);
        setTimeout(() => setIsConnected(true), 1500);
      }
    }, 8000);
    return () => clearInterval(flicker);
  }, []);

  const handleTerminate = () => {
    // 🛡️ Fix Bug 1: Use sockets for termination instead of LocalStorage (which doesn't sync across devices)
    socketService.emitAdminMessage({
      examId: sessionData.examId,
      studentId: sessionData.id,
      type: 'direct',
      action: 'TERMINATE',
      message: 'Your exam has been terminated by the administrator.',
      severity: 'critical'
    });

    const role = sessionStorage.getItem('vision_role')?.toLowerCase();
    navigate(role === 'mentor' ? '/mentor' : '/admin');
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    socketService.sendWarningToast(sessionData.id, messageInput);
    setMessages(prev => [...prev, { text: messageInput, from: 'admin', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setMessageInput('');
    toast.success("Warning sent to student!");
  };

  const handleBlockToggle = () => {
    if (isBlocked) {
      socketService.unblockStudent(sessionData.id, sessionData.examId);
      setIsBlocked(false);
      toast.success("Student unblocked!");
    } else {
      socketService.blockStudent(sessionData.id, sessionData.examId);
      setIsBlocked(true);
      toast.error("Student blocked!");
    }
  };

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    
    socketService.emitAdminMessage({
      examId: sessionData.examId,
      type: 'broadcast',
      message: broadcastMessage.trim(),
      severity: 'warning', // Default for broadcast
      requiresAck: true
    });

    setShowBroadcastModal(false);
    setBroadcastMessage('');
    toast.success("Broadcast message sent to all students!");
  };

  const handleFlagSession = () => {
    const incident = {
      id: `INC-${Date.now()}`,
      type: 'Manual Flag',
      severity: 'medium',
      details: `Session ${sessionData.id} (${sessionData.name}) manually flagged by admin during live monitoring.`,
      timestamp: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('vision_incidents') || '[]');
    localStorage.setItem('vision_incidents', JSON.stringify([incident, ...existing]));
  };

  const filteredLogs = selectedLogFilter === 'all'
    ? activityLogs
    : activityLogs.filter(l => l.severity === selectedLogFilter);

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0b0f] font-sans text-zinc-200 select-none">

      {/* ──── Left: Main Monitoring Area ──── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="flex h-12 items-center justify-between border-b border-white/5 bg-[#0f1117]/90 px-5 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs font-semibold"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <VisionLogo className="h-4 w-4 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Session Monitor</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
              isConnected
                ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                : 'text-red-400 border-red-500/20 bg-red-500/5 animate-pulse'
            }`}>
              {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/20 bg-indigo-500/5">
              <Radio size={10} className="animate-pulse" />
              Live
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800/50 border border-white/5">
              <Clock size={10} />
              {formatElapsed(elapsedTime)}
            </div>
          </div>
        </header>
        
        {/* Per-Exam Health & Alerts */}
        <div className="px-5 py-3 border-b border-white/[0.04] bg-[#0c0d12]">
          <AdminHealthCockpit 
            examId={sessionData.examId} 
            currentUserId={sessionStorage.getItem('vision_id') || sessionStorage.getItem('vision_email')} 
          />
        </div>

        {/* Student Info Strip */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.04] bg-[#0c0d12] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg">
              {sessionData.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{sessionData.name}</span>
                <span className="font-mono text-[9px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{sessionData.id}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><BookOpen size={10} /> {sessionData.exam}</span>
                <span className="text-[10px] text-zinc-600">•</span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock size={10} /> {sessionData.time}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
              sessionData.risk === 'High' ? 'text-red-400 border-red-500/20 bg-red-500/5' :
              sessionData.risk === 'Medium' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' :
              'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
            }`}>
              <Shield size={11} />
              {sessionData.risk} Risk
            </div>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all active:scale-95"
            >
              <Radio size={11} /> Broadcast
            </button>
            <button
              onClick={handleFlagSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all active:scale-95"
            >
              <Flag size={11} /> Flag
            </button>
            <button
               onClick={() => setShowTerminateConfirm(true)}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-all active:scale-95"
             >
               <OctagonX size={11} /> Terminate
             </button>
             <button
               onClick={handleBlockToggle}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                 isBlocked 
                   ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10' 
                   : 'text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200'
               }`}
             >
               {isBlocked ? <CheckCircle2 size={11} /> : <LockIcon size={11} />}
               {isBlocked ? 'Unblock Student' : 'Block Student'}
             </button>
           </div>
         </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">

          {/* Video Feeds */}
          <div className={`flex gap-4 ${screenExpanded ? 'flex-1' : ''}`} style={{ minHeight: screenExpanded ? 0 : '320px', height: screenExpanded ? 'auto' : '320px' }}>
            {/* Screen Capture */}
            <div className="flex-[2] flex flex-col bg-[#0f1117] rounded-2xl border border-white/[0.06] overflow-hidden relative group">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] bg-black/30 shrink-0">
                <div className="flex items-center gap-2">
                  <Monitor size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Screen Capture</span>
                </div>
                <button
                  onClick={() => setScreenExpanded(!screenExpanded)}
                  className="text-zinc-600 hover:text-white transition-colors"
                >
                  {screenExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </div>
              <div className="flex-1 p-2 relative">
                <SimulatedScreen />
                {!isConnected && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <WifiOff size={24} className="text-red-500 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs text-red-400 font-bold">Connection Lost</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Attempting to reconnect...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Webcam Feed */}
            <div className="flex-1 flex flex-col bg-[#0f1117] rounded-2xl border border-white/[0.06] overflow-hidden relative">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] bg-black/30 shrink-0">
                <div className="flex items-center gap-2">
                  <Camera size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Webcam</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[8px] text-red-400 font-bold">REC</span>
                </div>
              </div>
              <div className="flex-1 p-2">
                <SimulatedWebcam risk={sessionData.risk} />
              </div>
            </div>
          </div>

          {/* Bottom Metrics Strip */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {[
              { label: 'Trust Score', value: `${Math.round(metrics.trustScore.value)}%`, data: metrics.trustScore.history, color: metrics.trustScore.value > 70 ? '#34d399' : metrics.trustScore.value > 50 ? '#fbbf24' : '#ef4444', icon: Shield },
              { label: 'Gaze Deviation', value: `${Math.round(metrics.gazeDeviation.value)}°`, data: metrics.gazeDeviation.history, color: metrics.gazeDeviation.value < 20 ? '#34d399' : '#fbbf24', icon: Eye },
              { label: 'Audio Level', value: `${Math.round(metrics.audioLevel.value)}dB`, data: metrics.audioLevel.history, color: metrics.audioLevel.value < 40 ? '#818cf8' : '#fbbf24', icon: Volume2 },
              { label: 'Tab Switches', value: String(metrics.tabSwitches.value), data: metrics.tabSwitches.history, color: metrics.tabSwitches.value > 2 ? '#ef4444' : '#34d399', icon: Globe },
            ].map((m, i) => (
              <div key={i} className="bg-[#0f1117] rounded-xl border border-white/[0.06] p-3 hover:border-white/[0.12] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <m.icon size={11} style={{ color: m.color }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">{m.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{m.value}</span>
                </div>
                <Sparkline data={m.data} color={m.color} height={22} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ──── Right: Activity Sidebar ──── */}
      <aside className="w-80 shrink-0 flex flex-col border-l border-white/5 bg-[#0c0d12] overflow-hidden">

        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">Activity Feed</span>
          </div>
          <span className="text-[9px] font-mono text-zinc-700 bg-white/5 px-1.5 py-0.5 rounded">{activityLogs.length} events</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.04] shrink-0">
          {[
            { key: 'all', label: 'All' },
            { key: 'high', label: 'Critical', color: 'text-red-400' },
            { key: 'medium', label: 'Warning', color: 'text-amber-400' },
            { key: 'low', label: 'Normal', color: 'text-emerald-400' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setSelectedLogFilter(f.key)}
              className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                selectedLogFilter === f.key
                  ? 'bg-white/10 text-white'
                  : `text-zinc-600 hover:text-zinc-400 hover:bg-white/5 ${f.color || ''}`
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Activity Log */}
        <div className="flex-1 overflow-y-auto">
          {filteredLogs.map((log, i) => {
            const Icon = log.icon;
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div
                key={log.id}
                className={`px-4 py-2.5 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors ${
                  i === 0 ? 'bg-white/[0.01] animate-[fadeIn_0.3s_ease-out]' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 w-6 h-6 rounded-lg ${log.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={11} className={log.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold ${log.color}`}>{log.label}</span>
                      <span className="text-[8px] font-mono text-zinc-700 shrink-0">{time}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5 truncate">{log.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Message / Admin Message Controls */}
        <div className="border-t border-white/[0.06] p-3 shrink-0">
          <AdminMessageControls 
            examId={sessionData.examId} 
            activeStudents={[{ _id: sessionData.id, name: sessionData.name }]} 
            mode="compact" 
          />
        </div>
      </aside>

      {/* ──── Terminate Confirmation Modal ──── */}
      {showTerminateConfirm && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150]" onClick={() => setShowTerminateConfirm(false)} />
          <div className="fixed inset-0 z-[151] flex items-center justify-center p-8 pointer-events-none">
            <div className="bg-[#13151b] border border-red-500/30 rounded-2xl w-full max-w-md p-8 shadow-2xl pointer-events-auto">
              <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6 mx-auto flex items-center justify-center">
                <OctagonX size={28} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Terminate Session</h3>
              <p className="text-zinc-400 text-sm text-center mb-2">
                This will immediately terminate the exam session for:
              </p>
              <div className="bg-[#0f1117] rounded-xl p-4 border border-white/[0.06] mb-6 text-center">
                <p className="text-white font-bold">{sessionData.name}</p>
                <p className="text-zinc-500 text-xs font-mono mt-1">{sessionData.id} · {sessionData.exam}</p>
              </div>
              <p className="text-red-400/70 text-xs text-center mb-6">This action cannot be undone. The student will see a termination notice.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowTerminateConfirm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold">Cancel</button>
                <button onClick={handleTerminate} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all text-sm font-bold shadow-lg active:scale-95">
                  Terminate Exam
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ──── Broadcast Modal ──── */}
      {showBroadcastModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150]" onClick={() => setShowBroadcastModal(false)} />
          <div className="fixed inset-0 z-[151] flex items-center justify-center p-8 pointer-events-none">
            <div className="bg-[#13151b] border border-blue-500/30 rounded-2xl w-full max-w-md p-8 shadow-2xl pointer-events-auto">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-6 mx-auto flex items-center justify-center">
                <Radio size={28} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Live Broadcast</h3>
              <p className="text-zinc-400 text-sm text-center mb-6">
                Send an important announcement to all students currently taking the exam.
              </p>
              <textarea
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="E.g., Correction in Question 4: Use array instead of list."
                className="w-full bg-[#0f1117] border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 outline-none mb-6 resize-none h-24"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowBroadcastModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold">Cancel</button>
                <button onClick={handleBroadcast} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all text-sm font-bold shadow-lg active:scale-95 flex items-center justify-center gap-2">
                  <Radio size={14} /> Send Broadcast
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
