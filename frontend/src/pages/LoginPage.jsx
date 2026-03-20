import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, User, Lock, ShieldCheck, Webcam, MonitorCheck, Activity,
  TerminalSquare, ScanFace, Video, BrainCircuit, Database,
  Globe, ScrollText, MapPin, AppWindow
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeDiagnostics, setActiveDiagnostics] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));

  // Clock TICK
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simple UI Animation (Simulated initialization)
  useEffect(() => {
    setActiveDiagnostics(0);
    setScanProgress(0);
    
    // Animate diagnostics icons
    const diagTimer = setInterval(() => {
      setActiveDiagnostics(prev => {
        if (prev < 4) return prev + 1;
        clearInterval(diagTimer);
        return prev;
      });
    }, 400);

    // Animate face scanner for Candidate role
    let progressTimer;
    if (role === 'student') {
      const startScan = setTimeout(() => {
        let val = 0;
        progressTimer = setInterval(() => {
          val += 5;
          if (val >= 100) {
            setScanProgress(100);
            clearInterval(progressTimer);
          } else {
            setScanProgress(val);
          }
        }, 50);
      }, 600);
      
      return () => {
        clearInterval(diagTimer);
        clearInterval(progressTimer);
        clearTimeout(startScan);
      };
    }
    
    return () => clearInterval(diagTimer);
  }, [role]);

  const getDiagnostics = () => {
    const base = [
      { id: 'webcam', label: 'Webcam Hardware Active', icon: <Webcam size={16} />, status: 'secure' },
      { id: 'ext', label: 'Display Configuration Verified', icon: <MonitorCheck size={16} />, status: 'secure' },
      { id: 'tabs', label: 'Environment Isolated', icon: <AppWindow size={16} />, status: 'secure' },
      { id: 'lock', label: 'Secure Browser Sandbox', icon: <Lock size={16} />, status: 'secure' }
    ];
    if (role === 'mentor') {
      return [
        { id: 'cam', label: 'Live Room View Engaged', icon: <Video size={16} /> },
        { id: 'fraud', label: 'Fraud Detection Active', icon: <BrainCircuit size={16} /> },
        { id: 'ai', label: 'AI Behavior Analytics', icon: <Activity size={16} /> },
        { id: 'enc', label: 'P2P Encrypted Channel', icon: <Lock size={16} /> }
      ];
    }
    if (role === 'admin') {
      return [
        { id: 'tel', label: 'System Telemetry Synced', icon: <Database size={16} /> },
        { id: 'glob', label: 'Global Infrastructure Up', icon: <Globe size={16} /> },
        { id: 'audit', label: 'Audit Trails Recording', icon: <ScrollText size={16} /> },
        { id: 'lvl1', label: 'Level-1 Admins Protocols', icon: <Shield size={16} /> }
      ];
    }
    return base;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsAuthenticating(true);

    setTimeout(() => {
      setIsAuthenticating(false);
      if (role === 'student') navigate('/exam/E7X9-PQR2-LMN0');
      else if (role === 'mentor') navigate('/mentor');
      else navigate('/admin');
    }, 1500);
  };

  const diagnostics = getDiagnostics();

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60"></div>
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-primary-400/10"></div>

      {/* Main Container */}
      <div className="w-full max-w-[1000px] h-[90vh] max-h-[700px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex overflow-hidden relative z-10">
        
        {/* Left Panel (Visual Highlights) */}
        <div className="w-full md:w-[45%] bg-[#0b0f19] p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0b0f19] via-[#0f172a] to-[#0a0f1c]"></div>
          
          <div className="relative z-10 w-full flex flex-col flex-grow">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8 opacity-90 w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-primary-500/20 text-primary-400 border-primary-500/30">
                <Shield size={16} />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white select-none">Procto<span className="text-primary-400">Shield</span></span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-white">System Health</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">Verifying environment integrity protocols. Proceed securely.</p>

            <div className="space-y-3 flex-grow">
              {diagnostics.map((check, idx) => {
                const isLoaded = activeDiagnostics > idx;
                return (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border backdrop-blur-md transition-all duration-700 ${isLoaded ? 'bg-slate-800/40 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-slate-800/20 border-slate-700/50 opacity-60'}`}>
                    <div className="flex items-center gap-3 transition-colors">
                      <div className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center border transition-all duration-500 ${isLoaded ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-slate-900/80 text-slate-500 border-slate-700/50'}`}>
                        {check.icon}
                      </div>
                      <span className={`text-[11px] font-semibold tracking-wide ${isLoaded ? 'text-white' : 'text-slate-400'}`}>{check.label}</span>
                    </div>
                    {isLoaded ? (
                      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-emerald-400">
                        <div className="flex items-end gap-[1.5px] h-2.5">
                          <div className="w-[1.5px] bg-emerald-400 rounded-full animate-pulse h-[40%]"></div>
                          <div className="w-[1.5px] bg-emerald-400 rounded-full animate-pulse h-[100%]"></div>
                          <div className="w-[1.5px] bg-emerald-400 rounded-full animate-pulse h-[60%]"></div>
                        </div>
                        SECURE
                      </div>
                    ) : <span className="text-slate-500 text-[9px] uppercase tracking-widest font-bold">WAIT</span>}
                  </div>
                );
              })}
            </div>
            
            {/* Simulated AI Terminal */}
            <div className="mt-6 w-full bg-[#05080f]/90 rounded-xl p-3 border border-slate-800 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] h-[80px] overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2 border-b border-slate-800/60 pb-1.5">
                <TerminalSquare size={10} className="text-emerald-500" />
                <span className="text-[8px] uppercase tracking-[0.2em] font-black text-slate-500">AI Vigilance Output</span>
              </div>
              <div className="font-mono text-[9px] space-y-0.5 text-emerald-400/80">
                <p className="flex items-center gap-1.5"><span className="text-slate-600">&gt;</span> Tracking gaze patterns: <span className="text-emerald-300">ACTIVE</span></p>
                <p className="flex items-center gap-1.5"><span className="text-slate-600">&gt;</span> Noise cancelation hook: <span className="text-emerald-300">SECURE</span></p>
                <p className="flex items-center gap-1.5"><span className="text-slate-600">&gt;</span> Environment integrity: <span className="text-emerald-300">100%</span></p>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="mt-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] font-mono shadow-sm w-fit">
              <MapPin size={10} />
              <span>Geofence: <span className="text-white font-bold ml-1">Bengaluru, IN</span> [VERIFIED]</span>
            </div>
          </div>
        </div>

        {/* Right Panel (Simplified Form) */}
        <div className="w-full md:w-[55%] bg-white flex flex-col p-8 lg:p-12 relative h-full overflow-hidden">
          <div className="w-full max-w-sm mx-auto flex-grow flex flex-col justify-center">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">Gateway Access</h1>
              <p className="text-slate-500 text-xs font-medium">Please authenticate to continue.</p>
            </div>

            {/* Role Switcher */}
            <div className="relative flex p-1 bg-slate-50 border border-slate-100 rounded-xl mb-8 shadow-inner overflow-hidden">
              {/* Sliding Indicator */}
              <div 
                className="absolute top-1 bottom-1 left-1 w-[calc(33.333%-2px)] bg-white rounded-lg border border-slate-100 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                style={{ 
                  transform: `translateX(${role === 'student' ? '0' : role === 'mentor' ? '100%' : '200%'})`
                }}
              ></div>

              {['student', 'mentor', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg relative z-10 transition-colors duration-500 ${role === r ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                  onClick={() => setRole(r)}
                >
                  {r === 'student' ? <User size={12} /> : r === 'mentor' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                  {r === 'student' ? 'Candidate' : r === 'mentor' ? 'Mentor' : 'Admin'}
                </button>
              ))}
            </div>

            {/* Simulated Face Scan circle for Candidate */}
            {role === 'student' && (
              <div className="mb-8 flex flex-col items-center">
                <div className="relative w-20 h-20 mb-3">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                    <circle 
                      cx="50" cy="50" r="46" 
                      fill="none" 
                      stroke="#6366F1" 
                      strokeWidth="4" 
                      strokeLinecap="round"
                      strokeDasharray="289"
                      strokeDashoffset={289 - (289 * scanProgress) / 100}
                      className="transition-all duration-300 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-[6px] rounded-full bg-slate-50 flex items-center justify-center shadow-inner">
                    <User size={30} className={`transition-colors duration-500 ${scanProgress === 100 ? 'text-primary-600' : 'text-slate-300'}`} />
                  </div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm transition-all ${scanProgress === 100 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-500 bg-slate-50 border-slate-200 uppercase tracking-widest'}`}>
                  {scanProgress === 100 ? <><ShieldCheck size={10} className="inline mr-1" /> Biometric Verified</> : `Scanning... ${scanProgress}%`}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5 ml-1">ID / Email</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'student' ? "PROCTO-89241" : "system@procto.edu"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3.5 text-sm font-semibold outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5 ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3.5 text-sm tracking-[0.2em] font-medium outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-4 mt-2 font-bold text-sm shadow-lg shadow-primary-100 active:scale-[0.98] transition-all disabled:opacity-80"
              >
                {isAuthenticating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <ShieldCheck size={18} />
                )}
                <span>{isAuthenticating ? 'Authorizing...' : 'Secure Login'}</span>
              </button>
            </form>
          </div>

          {/* Technical Footer */}
          <div className="mt-8 flex items-center justify-between text-[9px] font-mono font-medium text-slate-400 border-t border-slate-100 pt-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1"><TerminalSquare size={10} className="text-slate-300"/> Session: PS-9928-XQ</span>
              <span>|</span>
              <span className="flex items-center gap-1"><Globe size={10} className="text-slate-300"/> Asia-South (BOM)</span>
            </div>
            <div className="font-bold tabular-nums bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
              {currentTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
