import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Shield, User, Lock as LockIcon, ShieldCheck, Webcam, MonitorCheck, Activity,
  TerminalSquare, Video, BrainCircuit, Database,
  Globe, ScrollText, MapPin, AppWindow, AlertTriangle
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import VisionLogo from '../components/VisionLogo';

/* ─────────────── Config & Constants ─────────────── */

const ROLE_DATA = {
  student: {
    label: 'Candidate',
    icon: <User size={12} />,
    diagnostics: [
      { id: 'webcam', label: 'Webcam Ready', icon: <Webcam size={16} /> },
      { id: 'ext', label: 'Display Verified', icon: <MonitorCheck size={16} /> },
      { id: 'tabs', label: 'Secure Environment', icon: <AppWindow size={16} /> },
      { id: 'lock', label: 'Safe Browser Active', icon: <LockIcon size={16} /> }
    ]
  },
  mentor: {
    label: 'Mentor',
    icon: <ShieldCheck size={12} />,
    diagnostics: [
      { id: 'cam', label: 'Live Monitoring Active', icon: <Video size={16} /> },
      { id: 'fraud', label: 'Detection System On', icon: <BrainCircuit size={16} /> },
      { id: 'ai', label: 'Smart Analytics Active', icon: <Activity size={16} /> },
      { id: 'enc', label: 'Secure Channel Link', icon: <LockIcon size={16} /> }
    ]
  },
  admin: {
    label: 'Admin',
    icon: <Shield size={12} />,
    diagnostics: [
      { id: 'tel', label: 'Data Sync Complete', icon: <Database size={16} /> },
      { id: 'glob', label: 'Network Connected', icon: <Globe size={16} /> },
      { id: 'audit', label: 'Activity Logging On', icon: <ScrollText size={16} /> },
      { id: 'lvl1', label: 'Admin Access Level 1', icon: <Shield size={16} /> }
    ]
  }
};

/* ─────────────── Sub-components ─────────────── */

const DiagnosticSidebar = ({ role, currentTime }) => {
  return (
    <div className="w-full md:w-[45%] bg-slate-50 p-7 flex flex-col justify-between relative overflow-hidden hidden md:flex h-full border-r border-slate-200">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100"></div>
      
      <div className="relative z-10 w-full flex flex-col h-full">
        <div className="flex items-center gap-2.5 opacity-90 w-fit shrink-0">
          <VisionLogo className="w-8 h-8 text-slate-900" />
          <span className="text-[15px] font-bold tracking-widest text-slate-900 uppercase">VISION</span>
        </div>

        <div className="flex flex-col flex-grow mt-6 mb-8 max-h-full overflow-hidden">
          <h2 className="text-lg font-bold tracking-tight mb-1 text-slate-900 shrink-0">Terms & Conditions</h2>
          <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-6 shrink-0">Please read our service agreements carefully.</p>

          <div className="overflow-y-auto pr-2 custom-scrollbar text-[11.5px] text-slate-600 space-y-4 leading-relaxed">
            {role === 'student' && (
              <>
                <p><strong className="text-slate-800 text-xs">1. Data Privacy & Monitoring</strong><br/>By using the Vision Secure Layer, you consent to continuous identity verification, behavioral analytics, and session recording to ensure academic integrity.</p>
                <p><strong className="text-slate-800 text-xs">2. Secure Environment</strong><br/>You must maintain a strict, unauthorized-device-free environment. Any detection of virtual machines, screen sharing software, or external displays may result in immediate session termination.</p>
                <p><strong className="text-slate-800 text-xs">3. System Access</strong><br/>Access is strictly limited to authorized personnel and registered candidates. Attempting to bypass security protocols is a violation of institutional policy.</p>
                <p><strong className="text-slate-800 text-xs">4. Liability</strong><br/>We are not liable for session interruptions caused by your local network instability or hardware failure.</p>
              </>
            )}
            
            {role === 'mentor' && (
              <>
                <p><strong className="text-slate-800 text-xs">1. Invigilation Ethics</strong><br/>By accessing the mentor portal, you agree to maintain fair, unbiased, and vigilant supervision of all assigned examination sessions.</p>
                <p><strong className="text-slate-800 text-xs">2. Data Confidentiality</strong><br/>You must not share, capture, or distribute any candidate personal data, session recordings, or examination content outside of this secure environment.</p>
                <p><strong className="text-slate-800 text-xs">3. System Access</strong><br/>Access is granted solely for active invigilation and candidate support purposes. Unauthorized usage or account sharing is strictly prohibited.</p>
                <p><strong className="text-slate-800 text-xs">4. Incident Reporting</strong><br/>All suspicious candidate activities, system anomalies, or security breaches must be documented and reported immediately through designated channels.</p>
              </>
            )}

            {role === 'admin' && (
              <>
                <p><strong className="text-slate-800 text-xs">1. Administrative Responsibility</strong><br/>By accessing the admin portal, you acknowledge your responsibility for maintaining overarching system integrity, security, and user access control.</p>
                <p><strong className="text-slate-800 text-xs">2. Data Governance</strong><br/>You are authorized to access sensitive institutional data. Unauthorized export, modification, or exposure of this data violates core security policies.</p>
                <p><strong className="text-slate-800 text-xs">3. Audit & Logging</strong><br/>All administrator actions are continuously logged and audited. Attempting to bypass security protocols or alter audit trails is strictly prohibited.</p>
                <p><strong className="text-slate-800 text-xs">4. Compliance Enforcement</strong><br/>You are responsible for ensuring that platform operations comply with institutional policies and applicable global data protection regulations.</p>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-4 mt-auto">
          <div className="flex items-center gap-1.5 text-[10px] font-mono w-fit text-slate-500">
            <MapPin size={12} className="text-emerald-500" />
            <span>Location: <span className="text-slate-800 font-bold ml-1">Bengaluru, IN</span> <span className="text-emerald-600 font-bold ml-1">[VERIFIED]</span></span>
          </div>
          
          <div className="flex items-center justify-between font-mono font-bold text-slate-400 border-t border-slate-200 uppercase w-full pt-4">
            <span className="text-[11px] tracking-wide">&copy; {new Date().getFullYear()} All Rights Reserved</span>
            <div className="text-slate-500 tabular-nums text-[12px]">
              {currentTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleSwitcher = ({ currentRole, setRole }) => (
  <div className="relative flex p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-inner overflow-hidden mb-6">
    {Object.keys(ROLE_DATA).map((r) => (
      <button
        key={r}
        type="button"
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-lg relative transition-colors duration-200 focus:outline-none ${currentRole === r ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        onClick={() => setRole(r)}
      >
        {currentRole === r && (
          <motion.div
            layoutId="login-role-pill"
            className="absolute inset-0 bg-white rounded-lg border border-slate-200 shadow-sm z-0"
            initial={false}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          {ROLE_DATA[r].icon}
          {ROLE_DATA[r].label}
        </span>
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
    <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors duration-300 flex items-center justify-center h-6 ${progress === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
      {progress === 100 ? <><ShieldCheck size={13} strokeWidth={2.5} className="mr-1.5" /> Identity Verified</> : `Connecting... ${progress}%`}
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
  const [termsAccepted, setTermsAccepted] = useState(false);
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
      // 🛡️ Fix Bug 2: Use localStorage instead of sessionStorage for persistent device fingerprinting
      let deviceId = localStorage.getItem('vision_device_id');
      if (!deviceId) {
          deviceId = (window.crypto && window.crypto.randomUUID) 
              ? window.crypto.randomUUID() 
              : `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
          localStorage.setItem('vision_device_id', deviceId);
      }

      // 🚀 Real API Authentication
      const response = await api.post('/api/auth/login', {
        email,
        password,
        role: role, // Backend needs to know the requested role for admin impersonation
        deviceId
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      // Store real session data
      sessionStorage.setItem('vision_token', accessToken);
      localStorage.setItem('vision_refresh_token', refreshToken);
      sessionStorage.setItem('vision_id', userData.id || userData._id);
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

      // 🛡️ Fix Bug 3: Super Mentor redirection to mentor dashboard
      const target = userData.role === 'student' 
        ? '/student' 
        : (['mentor', 'super_mentor'].includes(userData.role) ? '/mentor' : '/admin');
      navigate(target);
    } catch (err) {
      console.error('Login Error:', err);
      const rawErr = err.response?.data?.error;
      setError((typeof rawErr === 'string' ? rawErr : null) || err.response?.data?.message || 'Authorization failed. Please check your identity or secure key.');
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
        <DiagnosticSidebar role={role} currentTime={currentTime} />

        <div className="w-full md:w-[55%] bg-white flex flex-col p-7 relative self-stretch">
          <motion.div layout className="w-full max-sm mx-auto flex flex-col flex-1 justify-center">
            <motion.div layout className={`text-center ${role === 'student' ? 'mb-4' : 'mb-8'}`}>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Welcome Back</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Please sign in to continue</p>
            </motion.div>

            <motion.div layout>
              <RoleSwitcher currentRole={role} setRole={(r) => { setRole(r); setError(null); }} />
            </motion.div>
            
            <AnimatePresence mode="popLayout">
              {role === 'student' && (
                <motion.div 
                  layout
                  initial={{ opacity: 0, height: 0, scale: 0.9 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.9 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="overflow-hidden"
                >
                  <BiometricScanner progress={scanProgress} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form layout onSubmit={handleSubmit} className="transition-all duration-500 space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'student' ? "student@institution.com" : "admin@institution.com"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400 transition-all text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
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
                {error && (
                  <p className="text-rose-500 text-xs font-medium mt-2 ml-1">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 mt-4 mb-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 bg-slate-50 cursor-pointer transition-all"
                />
                <label htmlFor="terms" className="text-[11px] text-slate-500 leading-snug cursor-pointer select-none">
                  I have read and agree to the <span className="font-bold text-slate-700">Terms & Conditions</span>. I understand that my session will be securely monitored.
                </label>
              </div>

              <div className={role === 'student' ? 'mt-2' : 'mt-8'}>
                <button
                  type="submit"
                  disabled={isAuthenticating || !termsAccepted}
                  className={`w-full bg-white text-[#0a0c10] rounded-[2rem] py-3.5 font-bold text-xs tracking-[0.1em] uppercase transition-all shadow-md active:scale-[0.98] ${!termsAccepted ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-slate-200'}`}
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  {isAuthenticating ? <span className="flex items-center justify-center gap-3"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Signing in...</span> : 'Sign In'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
