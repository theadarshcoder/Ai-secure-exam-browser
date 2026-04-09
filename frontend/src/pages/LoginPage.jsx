import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Shield, User, Lock, ShieldCheck, Webcam, MonitorCheck, Activity,
  TerminalSquare, Video, BrainCircuit, Database,
  Globe, ScrollText, MapPin, AppWindow, AlertTriangle
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import { ThemeToggle } from '../contexts/ThemeContext';

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
    <div className="w-full md:w-[45%] bg-[#0b0f19] p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b0f19] via-[#0f172a] to-[#0a0f1c]"></div>
      
      <div className="relative z-10 w-full flex flex-col flex-grow">
        <div className="flex items-center gap-2.5 mb-8 opacity-90 w-fit">
          <VisionLogo className="w-8 h-8 text-white" />
          <span className="text-[15px] font-black tracking-[0.28em] text-white uppercase">VISION</span>
        </div>

        <h2 className="text-2xl font-black tracking-tight mb-1 text-white">System Health</h2>
        <p className="text-slate-400 text-xs leading-relaxed mb-6">Verifying environment integrity protocols. Proceed securely.</p>

        <div className="space-y-3 flex-grow">
          {data.diagnostics.map((check, idx) => {
            const isLoaded = activeCount > idx;
            return (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border backdrop-blur-md transition-all duration-700 ${isLoaded ? 'bg-slate-800/40 border-emerald-500/30 shadow-lg' : 'bg-slate-800/20 border-slate-700/50 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border transition-all ${isLoaded ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-slate-900/80 text-slate-500 border-slate-700/50'}`}>
                    {check.icon}
                  </div>
                  <span className={`text-[11px] font-bold tracking-wide ${isLoaded ? 'text-white' : 'text-slate-400'}`}>{check.label}</span>
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
        
        <div className="mt-6 w-full bg-[#05080f]/90 rounded-xl p-3 border border-slate-800 shadow-inner h-[90px] overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2 border-b border-slate-800/60 pb-1.5">
            <TerminalSquare size={10} className="text-emerald-500" />
            <span className="text-[8px] uppercase tracking-[0.2em] font-black text-slate-500">AI Vigilance Output</span>
          </div>
          <div className="font-mono text-[9px] space-y-0.5 text-emerald-400/80 uppercase">
            <p className="flex items-center gap-1.5"><span className="text-slate-600">&gt;</span> Tracking gaze patterns: <span className="text-emerald-300">ACTIVE</span></p>
            <p className="flex items-center gap-1.5"><span className="text-slate-600">&gt;</span> Noise cancelation hook: <span className="text-emerald-300">SECURE</span></p>
            <p className="flex items-center gap-1.5"><span className="text-slate-600">&gt;</span> Environment integrity: <span className="text-emerald-300">100%</span></p>
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
  <div className="relative flex p-1 bg-slate-950 border border-slate-800 rounded-xl mb-8 shadow-inner overflow-hidden">
    <div 
      className="absolute top-1 bottom-1 left-1 w-[calc(33.333%-2px)] bg-slate-800 rounded-lg border border-slate-700 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ transform: `translateX(${currentRole === 'student' ? '0' : currentRole === 'mentor' ? '100%' : '200%'})` }}
    />
    {Object.keys(ROLE_DATA).map((r) => (
      <button
        key={r}
        type="button"
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] uppercase tracking-widest font-black rounded-lg relative z-10 transition-colors duration-500 ${currentRole === r ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        onClick={() => setRole(r)}
      >
        {ROLE_DATA[r].icon}
        {ROLE_DATA[r].label}
      </button>
    ))}
  </div>
);

const BiometricScanner = ({ progress }) => (
  <div className="mb-8 flex flex-col items-center">
    <div className="relative w-20 h-20 mb-3">
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
      <div className="absolute inset-[6px] rounded-full bg-slate-950 flex items-center justify-center shadow-inner">
        <User size={30} className={`transition-colors duration-500 ${progress === 100 ? 'text-white' : 'text-slate-600'}`} />
      </div>
    </div>
    <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm transition-all ${progress === 100 ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' : 'text-slate-400 bg-slate-950 border-slate-800 uppercase tracking-widest'}`}>
      {progress === 100 ? <><ShieldCheck size={10} className="inline mr-1" /> Biometric Verified</> : `Syncing Hardware... ${progress}%`}
    </span>
  </div>
);

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

      const target = userData.role === 'student' ? '/student' : userData.role === 'mentor' ? '/mentor' : '/admin';
      navigate(target);
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.error || 'Authorization Failed: Check Identity or Secure Key.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-black font-sans overflow-hidden select-none">
      <style>{`html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }`}</style>
      
      {/* Theme toggle — fixed top-right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-white/5" />

      <div className="w-full max-w-[1000px] h-[90vh] max-h-[700px] bg-zinc-950 rounded-[2.5rem] shadow-2xl border border-zinc-800 flex overflow-hidden relative z-10">
        <DiagnosticSidebar role={role} activeCount={activeDiagnostics} />

        <div className="w-full md:w-[55%] bg-zinc-950 flex flex-col p-8 lg:p-12 relative h-full">
          <div className="w-full max-w-sm mx-auto flex-grow flex flex-col justify-center">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black tracking-tight text-white mb-1 uppercase">Gateway Access</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Please authenticate to continue.</p>
            </div>

            <RoleSwitcher currentRole={role} setRole={(r) => { setRole(r); setError(null); }} />
            {role === 'student' && <BiometricScanner progress={scanProgress} />}

            {error && (
              <div className="mb-6 flex items-start gap-3 p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl relative overflow-hidden group">
                <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center shrink-0 border border-red-500/20 shadow-inner">
                  <AlertTriangle size={14} className="text-red-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-red-400 mb-0.5">Authorization Failed</h3>
                  <p className="text-xs font-bold text-red-200/70">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1.5 ml-1">Access Identity</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'student' ? "VSN-89241" : "system@vision.auth"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/50 pl-10 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-slate-900 focus:border-white/20 transition-all text-white placeholder:text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1.5 ml-1">Pin / Secure Key</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/50 pl-10 pr-4 py-3.5 text-sm tracking-[0.3em] font-bold outline-none focus:bg-slate-900 focus:border-white/20 transition-all text-white placeholder:text-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full bg-white text-black rounded-[2rem] py-5 mt-2 font-black text-xs tracking-[0.2em] uppercase hover:bg-slate-200 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                >
                  {isAuthenticating ? <span className="flex items-center justify-center gap-3"><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Authenticating...</span> : 'Authorize & Enter'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-between text-[9px] font-mono font-bold text-slate-600 border-t border-slate-900 pt-4 uppercase">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><TerminalSquare size={10} /> Node: BOM-01</span>
              <span className="flex items-center gap-1.5"><Globe size={10} /> Asia-South</span>
            </div>
            <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-white tabular-nums">
              {currentTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
