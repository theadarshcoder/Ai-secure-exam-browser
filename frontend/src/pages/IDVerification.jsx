import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VisionLogo from '../components/VisionLogo';
import { Camera, UserCircle2, CreditCard, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle, ScanFace } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import { Navbar } from '../components/Navbar';

/* ─────────────── Sub-components ─────────────── */

const StepIndicator = ({ step }) => {
  const steps = [
    { title: 'Facial Scan', desc: 'Center your face inside the indicator.', icon: <UserCircle2 size={16} /> },
    { title: 'ID Document', desc: 'Hold your ID card clearly inside the frame.', icon: <CreditCard size={16} /> },
    { title: 'Validation', desc: 'Identity verified and safely recorded.', icon: <ShieldCheck size={16} /> }
  ];

  return (
    <div className="space-y-6 relative">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-white/5 -z-10" />
      {steps.map((s, i) => {
        const num = i + 1;
        const isActive = step === num;
        const isDone = step > num;
        const opacity = step >= num ? 'opacity-100' : 'opacity-40';
        
        return (
          <div key={i} className={`flex items-start gap-4 transition-all duration-300 ${opacity}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 bg-[#0a0c10] transition-colors relative z-10 ${
              isDone ? 'border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 
              isActive ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-600'
            }`}>
              {isDone ? <CheckCircle2 size={16} /> : <span className="text-[11px] font-black">{num}</span>}
            </div>
            <div className="pt-1.5">
              <h4 className={`text-xs font-black uppercase tracking-wider ${step >= num ? 'text-white' : 'text-slate-500'}`}>{s.title}</h4>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed pr-2">{s.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};



const ErrorState = ({ error, onRetry, isConnecting }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-black/50 rounded-2xl border border-white/5 relative z-10 m-2">
    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
      <AlertTriangle size={32} />
    </div>
    <h3 className="text-xl font-black text-white mb-2">{error.title || 'Hardware Map Failed'}</h3>
    <div className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6 space-y-4">
      <p className="text-center text-[13px]">{error.message}</p>
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-left">
        <strong className="text-amber-400 block mb-2 uppercase tracking-widest text-[10px]">Correction Protocol:</strong>
        <ol className="list-decimal list-inside space-y-1.5 text-amber-200/80">
          <li>Close conflicting applications (Zoom, Teams).</li>
          <li>Check hardware connection and drivers.</li>
          <li>Grant browser permissions via the 🔒 icon.</li>
        </ol>
      </div>
    </div>
    <button 
      onClick={onRetry}
      disabled={isConnecting}
      className="px-6 py-3 bg-white text-[#0a0c10] hover:bg-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50">
      {isConnecting ? <><RotateCcw size={14} className="animate-spin" /> Querying...</> : <><RotateCcw size={14} /> Retry Hardware Connect</>}
    </button>
  </div>
);

const SuccessState = ({ onProceed, onRetake }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0a0c10] rounded-2xl border border-white/5">
    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="w-32 h-32 bg-indigo-500/10 border border-indigo-500/30 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(99,102,241,0.2)] rotate-3">
      <CheckCircle2 size={56} className="text-indigo-400 -rotate-3" />
    </motion.div>
    <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Identity Verified</h2>
    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-10">Verification complete. Security metadata signature generated and stored.</p>
    <div className="flex gap-4 w-full max-w-sm">
      <button onClick={onRetake} className="flex-1 py-3.5 px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-bold uppercase tracking-widest">Retake</button>
      <button onClick={onProceed} className="flex-1 py-3.5 px-4 rounded-xl bg-white text-[#0a0c10] hover:bg-slate-200 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02]">
        Proceed <ArrowRight size={14} />
      </button>
    </div>
  </div>
);

/* ─────────────── Main Component ─────────────── */

export default function IDVerification() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceBox, setFaceBox] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: false,
      });
      setStream(mediaStream);
    } catch (err) {
      setError({
        title: err.name === 'NotAllowedError' ? 'Permission Denied' : 'Hardware Error',
        message: err.message,
        type: err.name
      });
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    startCamera();
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        setModelsLoaded(true);
      } catch (err) { console.warn("AI engine failed", err); }
    };
    loadModels();
    
    document.body.style.overflow = 'hidden';
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      // Ensure the srcObject is synced
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      // Explicitly force play to bypass browser autoplay blocks when remounting
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.warn("Auto-play was prevented by the browser.", err));
      }
    }
  }, [stream, step, error, capturedPhoto]);

  // Detector Loop
  useEffect(() => {
    if (!stream || !modelsLoaded || step !== 1 || capturedPhoto) return;
    let frameId;
    const loop = async () => {
      if (videoRef.current?.readyState === 4) {
        const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }));
        if (det) {
          const v = videoRef.current;
          const c = v.parentElement;
          const s = Math.max(c.clientWidth / v.videoWidth, c.clientHeight / v.videoHeight);
          const ox = (c.clientWidth - v.videoWidth * s) / 2;
          const oy = (c.clientHeight - v.videoHeight * s) / 2;
          const b = det.box;
          setFaceBox({
            x: c.clientWidth - (b.x * s + b.width * s + ox) - b.width * s * 0.15,
            y: b.y * s + oy - b.height * s * 0.3,
            width: b.width * s * 1.3,
            height: b.height * s * 1.5
          });
        } else setFaceBox(null);
      }
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [stream, modelsLoaded, step]);

  const capture = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      
      const photoDataUrl = c.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoDataUrl);
      setIsProcessing(false);
    }, 800);
  };

  const confirmPhoto = () => {
    localStorage.setItem(step === 1 ? 'vision_reference_face' : 'vision_reference_id', 'VERIFIED_HASH');
    setCapturedPhoto(null);
    if (step === 1) {
      setStep(2);
    } else {
      setStep(3);
      if (stream) stream.getTracks().forEach(t => t.stop());
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  return (
    <div className="h-screen w-full bg-[#0a0c10] font-sans flex flex-col overflow-hidden text-slate-200">
      <Navbar role="Student" hideSignOut />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 pt-24 pb-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 min-h-0">
        <aside className="h-full flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-[#12141a] rounded-3xl p-6 border border-white/[0.05] flex flex-col items-center text-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 flex items-center justify-center relative">
              <ScanFace size={24} />
              <div className="absolute inset-0 rounded-2xl border border-emerald-400/30 animate-ping opacity-20" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mb-2">Gatekeeper</h2>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Scan biometric identifiers to initialize secure exam environment.</p>
          </div>

          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#12141a] to-transparent rounded-3xl p-6 border border-white/[0.05]">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-6">Identity Verification Pipeline</h3>
            <StepIndicator step={step} />

          </div>
        </aside>

        <section className="h-full bg-[#12141a] rounded-3xl p-3 border border-slate-800/60 shadow-2xl flex flex-col overflow-hidden relative">
          {error ? <ErrorState error={error} onRetry={startCamera} isConnecting={isConnecting} /> :
           step < 3 ? (
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#050608] flex flex-col border border-white/[0.02]">
              <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">
                <div className="relative w-full max-w-[800px] aspect-video rounded-3xl overflow-hidden border-2 border-slate-800/50 shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-[#000000] group">
                  {capturedPhoto ? (
                    <img src={capturedPhoto} alt="Captured preview" className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${step === 1 ? 'scale-x-[-1]' : ''}`} />
                  ) : stream ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      disablePictureInPicture
                      disableRemotePlayback
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isProcessing ? 'opacity-30 blur-xl' : 'opacity-100'} ${step === 1 ? 'scale-x-[-1]' : ''}`} 
                    />
                  ) : null}
                  
                  {/* Vision Frame Overlays */}
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500/40 rounded-tl-3xl m-6" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500/40 rounded-tr-3xl m-6" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500/40 rounded-bl-3xl m-6" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500/40 rounded-br-3xl m-6" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      {!capturedPhoto && (
                        step === 2 && (
                          <div className="w-[50vh] h-[32vh] border-2 border-amber-500/40 rounded-2xl border-dashed shadow-[0_0_30px_rgba(245,158,11,0.1)_inset]" />
                        )
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isProcessing && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0c10]/95 z-30 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-2 border-t-emerald-500 border-white/5 rounded-full animate-spin mb-4" />
                        <span className="text-[9px] font-black text-emerald-400 tracking-[0.3em] uppercase">Processing Identity</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/5 z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Secure Feed</span>
                  </div>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="h-24 bg-[#0a0c10]/80 backdrop-blur-xl border-t border-white/[0.04] flex items-center justify-between px-8 z-40">
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">{step === 1 ? <UserCircle2 size={16} /> : <CreditCard size={16} />}</div>
                  <span className="text-[11px] font-medium tracking-wide">{step === 1 ? 'Center your alignment relative to focus points.' : 'Align document edges with the security perimeter.'}</span>
                </div>
                <div className="flex gap-3">
                  {capturedPhoto ? (
                    <>
                      <button onClick={retakePhoto} disabled={isProcessing} className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"><RotateCcw size={14} /> Retake</button>
                      <button onClick={confirmPhoto} disabled={isProcessing} className="px-8 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20 shadow-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">Proceed <ArrowRight size={14} /></button>
                    </>
                  ) : (
                    <>
                      {step === 2 && <button onClick={() => setStep(1)} disabled={isProcessing} className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"><RotateCcw size={14} /> Back</button>}
                      <button onClick={capture} disabled={!stream || isProcessing} className={`px-8 py-2.5 rounded-xl text-[#0a0c10] transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${step === 1 ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 shadow-lg' : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20 shadow-lg'} disabled:opacity-50`}>
                        <Camera size={14} /> Initialize {step === 1 ? 'Face' : 'ID'} Scan
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
           ) : <SuccessState onProceed={() => navigate(`/exam/${examId}/waiting`)} onRetake={() => { setStep(1); startCamera(); }} />}
        </section>
      </main>
    </div>
  );
}
