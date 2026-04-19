import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Shield, User, Lock, ShieldCheck, Webcam, MonitorCheck, Activity,
  TerminalSquare, Video, BrainCircuit, Database,
  Globe, ScrollText, MapPin, AppWindow, AlertTriangle
} from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import VisionLogo from '../components/VisionLogo';

/* ─────────────── Config & Constants ─────────────── */

const ROLE_DATA = {
  student: {
    label: 'Candidate',
    icon: <User size={12} />,
    diagnostics: [
      { id: 'webcam', label: 'Webcam Hardware Active', icon: <Webcam size={16} /> },
      { id: 'ext', label: 'Display Configuration Verified', icon: <MonitorCheck size={16} /> },
      { id: 'tabs', label: 'Environment Isolated', icon: <AppWindow size={16} /> },
      { id: 'lock', label: 'Secure Browser Sandbox', icon: <Lock size={16} /> }
    ]
  },
  mentor: {
    label: 'Mentor',
    icon: <ShieldCheck size={12} />,
    diagnostics: [
      { id: 'cam', label: 'Live Room View Engaged', icon: <Video size={16} /> },
      { id: 'fraud', label: 'Fraud Detection Active', icon: <BrainCircuit size={16} /> },
      { id: 'ai', label: 'AI Behavior Analytics', icon: <Activity size={16} /> },
      { id: 'enc', label: 'P2P Encrypted Channel', icon: <Lock size={16} /> }
    ]
  },
  admin: {
    label: 'Admin',
    icon: <Shield size={12} />,
    diagnostics: [
      { id: 'tel', label: 'System Telemetry Synced', icon: <Database size={16} /> },
      { id: 'glob', label: 'Global Infrastructure Up', icon: <Globe size={16} /> },
      { id: 'audit', label: 'Audit Trails Recording', icon: <ScrollText size={16} /> },
      { id: 'lvl1', label: 'Level-1 Admins Protocols', icon: <Shield size={16} /> }
    ]
  }
};

/* ─────────────── Sub-components ─────────────── */

const DiagnosticSidebar = ({ role, activeCount }) => {
  const data = ROLE_DATA[role];
  
  return (
    <div className="w-full md:w-[45%] bg-slate-50 p-7 flex flex-col justify-between relative overflow-hidden hidden md:flex h-full border-r border-slate-200">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100"></div>
      
      <div className="relative z-10 w-full flex flex-col flex-grow">
        <div className="flex items-center gap-2.5 mb-8 opacity-90 w-fit">
          <VisionLogo className="w-8 h-8 text-slate-900" />
          <span className="text-[15px] font-black tracking-[0.28em] text-slate-900 uppercase">VISION</span>
        </div>

        <h2 className="text-2xl font-black tracking-tight mb-1 text-slate-900">System Health</h2>
        <p className="text-slate-500 text-xs leading-relaxed mb-6">Verifying environment integrity protocols. Proceed securely.</p>

        <div className="space-y-3 flex-grow">
          {data.diagnostics.map((check, idx) => {
            const isLoaded = activeCount > idx;
            return (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-700 ${isLoaded ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border transition-all ${isLoaded ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {check.icon}
                  </div>
                  <span className={`text-[11px] font-bold tracking-wide ${isLoaded ? 'text-slate-800' : 'text-slate-400'}`}>{check.label}</span>
                </div>
                {isLoaded ? (
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-emerald-400">
                    <div className="flex items-end gap-[1px] h-2.5">
                      <div className="w-[1.5px] bg-emerald-400 rounded-full animate-pulse h-[40%]" />
                      <div className="w-[1.5px] bg-emerald-400 rounded-full animate-pulse h-[100%]" />
                      <div className="w-[1.5px] bg-emerald-400 rounded-full animate-pulse h-[60%]" />
                    </div>
                    SECURE
                  </div>
                ) : <span className="text-slate-500 text-[9px] uppercase tracking-widest font-bold">WAIT</span>}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 w-full bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-sm h-[95px] overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
            <TerminalSquare size={10} className="text-emerald-600" />
            <span className="text-[8px] uppercase tracking-[0.2em] font-black text-slate-500">AI Vigilance Output</span>
          </div>
          <div className="font-mono text-[9px] space-y-1 text-slate-600 uppercase">
            <p className="flex items-center gap-1.5 truncate"><span className="text-slate-400">&gt;</span> Tracking patterns: <span className="text-emerald-600 font-bold ml-auto">ACTIVE</span></p>
            <p className="flex items-center gap-1.5 truncate"><span className="text-slate-400">&gt;</span> Detection hook: <span className="text-emerald-600 font-bold ml-auto">SECURE</span></p>
            <p className="flex items-center gap-1.5 truncate"><span className="text-slate-400">&gt;</span> Environment lock: <span className="text-emerald-600 font-bold ml-auto">100%</span></p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] font-mono w-fit">
          <MapPin size={10} />
          <span>Geofence: <span className="text-white font-bold ml-1">Bengaluru, IN</span> [VERIFIED]</span>
        </div>
      </div>
    </div>
  );
};

const RoleSwitcher = ({ currentRole, setRole }) => (
  <div className={`relative flex p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-inner overflow-hidden ${currentRole === 'student' ? 'mb-4' : 'mb-10'}`}>
    <div 
      className="absolute top-1 bottom-1 left-1 w-[calc(33.333%-2px)] bg-white rounded-lg border border-slate-200 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ transform: `translateX(${currentRole === 'student' ? '0' : currentRole === 'mentor' ? '100%' : '200%'})` }}
    />
    {Object.keys(ROLE_DATA).map((r) => (
      <button
        key={r}
        type="button"
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] uppercase tracking-widest font-black rounded-lg relative z-10 transition-colors duration-500 ${currentRole === r ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        onClick={() => setRole(r)}
      >
        {ROLE_DATA[r].icon}
        {ROLE_DATA[r].label}
      </button>
    ))}
  </div>
);

const BiometricScanner = ({ progress }) => (
  <div className="mb-4 flex flex-col items-center">
    <div className="relative w-16 h-16 mb-2">
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle 
          cx="50" cy="50" r="46" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="4" 
          strokeLinecap="round"
          strokeDasharray="289"
          strokeDashoffset={289 - (289 * progress) / 100}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-[6px] rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
        <User size={30} className={`transition-colors duration-500 ${progress === 100 ? 'text-slate-800' : 'text-slate-400'}`} />
      </div>
    </div>
    <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border shadow-sm transition-all duration-300 ${progress === 100 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
      {progress === 100 ? <><ShieldCheck size={12} className="inline mr-1 mb-[2px]" /> Biometric Verified</> : `Syncing Hardware... ${progress}%`}
    </span>
  </div>
);

/* ─────────────── Interactive Background ─────────────── */

const VectorFieldBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ backgroundColor: '#09090b' }}>
      {/* Visible Base Dot Grid */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Brighter Interactive Spotlight tracking mouse */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.4] mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 60%)',
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%'
        }}
      />
    </div>
  );
};

/* ─────────────── Main Page ─────────────── */

const LoginPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeDiagnostics, setActiveDiagnostics] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000);
    return () => {
      document.body.style.overflow = 'auto';
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setActiveDiagnostics(0);
    setScanProgress(0);
    
    // Animate UI steps
    const interval = setInterval(() => {
      setActiveDiagnostics(prev => (prev < 4 ? prev + 1 : prev));
    }, 400);

    let scanInterval;
    if (role === 'student') {
      const wait = setTimeout(() => {
        scanInterval = setInterval(() => {
          setScanProgress(p => (p < 100 ? p + 5 : 100));
        }, 50);
      }, 600);
      return () => { clearInterval(interval); clearInterval(scanInterval); clearTimeout(wait); };
    }
    
    return () => clearInterval(interval);
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);
    
    try {
      // 🚀 Real API Authentication
      const response = await api.post('/api/auth/login', {
        email,
        password,
        role: role // Backend needs to know the requested role for admin impersonation
      });

      const { token, user: userData } = response.data;

      // Store real session data
      sessionStorage.setItem('vision_token', token);
      sessionStorage.setItem('vision_role', userData.role);
      sessionStorage.setItem('vision_email', userData.email);
      sessionStorage.setItem('vision_name', userData.name);

      // Trigger full screen for candidate (student) if needed
      if (userData.role === 'student') {
        const docElm = document.documentElement;
        if (docElm.requestFullscreen) {
          try {
            await docElm.requestFullscreen();
          } catch (err) {
            console.warn('Failed to enter full screen:', err);
          }
        }
      }

      const target = userData.role === 'student' ? '/student' : (userData.role === 'mentor' ? '/mentor' : '/admin');
      navigate(target);
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.error || 'Authorization failed. Please check your identity or secure key.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 font-sans overflow-hidden select-none relative z-0" style={{ backgroundColor: '#09090b' }}>
      <style>{`html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }`}</style>
      
      <VectorFieldBackground />

      {/* Emissive Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-white/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="w-full max-w-[1000px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex items-stretch overflow-hidden relative z-10 hover:shadow-xl transition-shadow duration-500">
        <DiagnosticSidebar role={role} activeCount={activeDiagnostics} />

        <div className="w-full md:w-[55%] bg-white flex flex-col p-7 relative self-stretch">
          <div className="w-full max-w-sm mx-auto flex flex-col flex-1 justify-center">
            <div className={`text-center ${role === 'student' ? 'mb-4' : 'mb-8'}`}>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1 uppercase">Gateway Access</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Please authenticate to continue.</p>
            </div>

            <RoleSwitcher currentRole={role} setRole={(r) => { setRole(r); setError(null); }} />
            {role === 'student' && <BiometricScanner progress={scanProgress} />}

            {error && (
              <div className="mb-4 flex items-start gap-3.5 p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl relative overflow-hidden group shadow-sm">
                <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0 border border-rose-200 mt-0.5">
                  <AlertTriangle size={13} className="text-rose-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[13px] font-semibold text-rose-900 mb-0.5 leading-snug">Authorization failed</h3>
                  <p className="text-xs font-normal text-rose-600 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={role === 'student' ? 'space-y-3' : 'space-y-6'}>
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1.5 ml-1">Access Identity</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'student' ? "VSN-89241" : "system@vision.auth"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1.5 ml-1">Pin / Secure Key</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm tracking-[0.3em] font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className={role === 'student' ? 'mt-4' : 'mt-10'}>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full bg-white text-[#0a0c10] hover:bg-slate-200 rounded-[2rem] py-3.5 font-bold text-xs tracking-[0.1em] uppercase transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  {isAuthenticating ? <span className="flex items-center justify-center gap-3"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Authenticating...</span> : 'Authorize & Enter'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 border-t border-slate-100 uppercase">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><TerminalSquare size={10} /> Server: Mumbai</span>
              <span className="flex items-center gap-1.5"><Globe size={10} /> Region: India</span>
            </div>
            <div className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-700 tabular-nums">
              {currentTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
