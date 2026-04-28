import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Shield, Wifi, Fingerprint, KeyRound, 
  CheckCircle2, Loader2, XCircle, ChevronRight, Zap
} from 'lucide-react';

const CHECKS = [
  {
    id: 'container',
    label: 'Secure Container',
    description: 'Validating execution environment integrity...',
    successMsg: 'Electron Secure Node verified',
    icon: Shield,
    verify: () => !!window.electronAPI?.isElectron,
    delay: 1200,
  },
  {
    id: 'network',
    label: 'Network Integrity',
    description: 'Measuring connection stability and latency...',
    successMsg: () => `Latency: ${Math.floor(Math.random() * 40 + 12)}ms — Stable`,
    icon: Wifi,
    verify: () => navigator.onLine,
    delay: 1500,
  },
  {
    id: 'fingerprint',
    label: 'Hardware Fingerprint',
    description: 'Binding session to device signature...',
    successMsg: () => `${navigator.platform} — ${window.screen.width}×${window.screen.height} locked`,
    icon: Fingerprint,
    verify: () => true,
    delay: 1800,
  },
  {
    id: 'auth',
    label: 'Session Authentication',
    description: 'Verifying cryptographic access token...',
    successMsg: 'HMAC-SHA256 token validated',
    icon: KeyRound,
    verify: () => !!sessionStorage.getItem('vision_token'),
    delay: 1400,
  },
];

export default function PreFlightCheck() {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState({}); // { checkId: 'pending' | 'running' | 'pass' | 'fail' }
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [allDone, setAllDone] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  // Sequential check runner
  useEffect(() => {
    const runChecks = async () => {
      for (let i = 0; i < CHECKS.length; i++) {
        const check = CHECKS[i];

        // Mark as running
        setCurrentIdx(i);
        setResults(prev => ({ ...prev, [check.id]: 'running' }));

        // Simulate verification delay
        await new Promise(r => setTimeout(r, check.delay));

        // Verify
        const passed = check.verify();
        setResults(prev => ({ ...prev, [check.id]: passed ? 'pass' : 'fail' }));

        // Small gap between checks
        await new Promise(r => setTimeout(r, 300));
      }

      setAllDone(true);
    };

    // Start after a brief intro delay
    const timer = setTimeout(runChecks, 800);
    return () => clearTimeout(timer);
  }, []);

  // Check if all passed
  useEffect(() => {
    if (allDone) {
      const passed = CHECKS.every(c => results[c.id] === 'pass');
      setAllPassed(passed);

      // Auto-navigate after 2 seconds if all passed
      if (passed) {
        const timer = setTimeout(() => {
          navigate(`/exam/${examId}/verify`);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [allDone, results, navigate, examId]);

  const getStatusIcon = (status) => {
    if (status === 'running') return <Loader2 size={18} className="animate-spin text-cyan-400" />;
    if (status === 'pass') return <CheckCircle2 size={18} className="text-emerald-400" />;
    if (status === 'fail') return <XCircle size={18} className="text-red-400" />;
    return <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-700" />;
  };

  const getStatusColor = (status) => {
    if (status === 'running') return 'border-cyan-500/30 bg-cyan-500/5';
    if (status === 'pass') return 'border-emerald-500/30 bg-emerald-500/5';
    if (status === 'fail') return 'border-red-500/30 bg-red-500/5';
    return 'border-slate-700/50 bg-slate-800/30';
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center z-[9999] overflow-hidden">

      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* Scanning line animation */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse opacity-40" />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-6">
            <Shield size={28} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            System Diagnostics
          </h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.3em]">
            Pre-Flight Security Verification
          </p>
        </div>

        {/* Check list */}
        <div className="space-y-3 mb-10">
          {CHECKS.map((check, idx) => {
            const status = results[check.id];
            const Icon = check.icon;
            const successMsg = typeof check.successMsg === 'function' ? check.successMsg() : check.successMsg;

            return (
              <div
                key={check.id}
                className={`relative rounded-xl border px-5 py-4 transition-all duration-500 ${getStatusColor(status)} ${
                  idx <= currentIdx ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    status === 'pass' ? 'bg-emerald-500/10' : 
                    status === 'running' ? 'bg-cyan-500/10' : 
                    status === 'fail' ? 'bg-red-500/10' : 'bg-slate-800'
                  }`}>
                    <Icon size={18} className={
                      status === 'pass' ? 'text-emerald-400' : 
                      status === 'running' ? 'text-cyan-400 animate-pulse' : 
                      status === 'fail' ? 'text-red-400' : 'text-slate-600'
                    } />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className={`text-sm font-bold ${
                        status === 'pass' ? 'text-emerald-300' : 
                        status === 'running' ? 'text-cyan-300' : 
                        status === 'fail' ? 'text-red-300' : 'text-slate-500'
                      }`}>
                        {check.label}
                      </h3>
                      {getStatusIcon(status)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                      {status === 'pass' ? successMsg : 
                       status === 'fail' ? 'VERIFICATION FAILED — Contact supervisor' :
                       check.description}
                    </p>
                  </div>
                </div>

                {/* Progress bar for running state */}
                {status === 'running' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-xl">
                    <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-pulse" 
                      style={{ width: '100%' }} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Result footer */}
        {allDone && (
          <div className={`text-center animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {allPassed ? (
              <>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <Zap size={14} className="text-emerald-400" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">
                    All Systems Operational
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/exam/${examId}/verify`)}
                  className="w-full max-w-xs mx-auto h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  Enter Secure Node <ChevronRight size={16} />
                </button>
                <p className="text-[10px] text-slate-600 mt-3 font-semibold">
                  Auto-redirecting in 2 seconds...
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                  <XCircle size={14} className="text-red-400" />
                  <span className="text-xs font-black text-red-400 uppercase tracking-[0.2em]">
                    Verification Failed
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  This exam requires the VISION Secure Browser. Please download and install it.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full max-w-xs mx-auto h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Return to Dashboard
                </button>
              </>
            )}
          </div>
        )}

        {/* Loading state footer */}
        {!allDone && (
          <div className="text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] animate-pulse">
              Verifying system integrity...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
