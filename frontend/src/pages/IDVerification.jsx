import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, UserCircle2, CreditCard, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle, ScanFace, Loader2, Power } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import { Navbar } from '../components/Navbar';
import api from '../services/api';
import { toast } from 'react-hot-toast';

/* ─────────────── Sub-components ─────────────── */

const StepIndicator = ({ step }) => {
  const steps = [
    { title: 'Facial Scan',  desc: 'Center your face inside the indicator.',   icon: <UserCircle2 size={15} /> },
    { title: 'ID Document',  desc: 'Hold your ID card clearly inside the frame.', icon: <CreditCard size={15} /> },
    { title: 'Validation',   desc: 'Identity verified and safely recorded.',    icon: <ShieldCheck size={15} /> }
  ];

  return (
    <div className="space-y-5 relative">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200 -z-10" />
      {steps.map((s, i) => {
        const num   = i + 1;
        const isActive = step === num;
        const isDone   = step > num;
        const muted    = step < num;

        return (
          <div key={i} className={`flex items-start gap-4 transition-all duration-300 ${muted ? 'opacity-40' : 'opacity-100'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors relative z-10 ${
              isDone   ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm' :
              isActive ? 'border-slate-800 bg-slate-800 text-white shadow-sm' :
                         'border-slate-200 bg-white text-slate-400'
            }`}>
              {isDone ? <CheckCircle2 size={15} /> : <span className="text-[11px] font-black">{num}</span>}
            </div>
            <div className="pt-1.5">
              <h4 className={`text-xs font-black uppercase tracking-wider ${!muted ? 'text-slate-800' : 'text-slate-400'}`}>{s.title}</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed pr-2">{s.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ErrorState = ({ error, onRetry, isConnecting }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50 rounded-2xl border border-red-100 relative z-10 m-2">
    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-5 border border-red-200">
      <AlertTriangle size={32} />
    </div>
    <h3 className="text-xl font-black text-slate-900 mb-2">{error.title || 'Hardware Map Failed'}</h3>
    <div className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6 space-y-4">
      <p className="text-center text-[13px]">{error.message}</p>
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left">
        <strong className="text-amber-700 block mb-2 uppercase tracking-widest text-[10px]">Correction Protocol:</strong>
        <ol className="list-decimal list-inside space-y-1.5 text-amber-700/80">
          <li>Close conflicting applications (Zoom, Teams).</li>
          <li>Check hardware connection and drivers.</li>
          <li>Grant browser permissions via the 🔒 icon.</li>
        </ol>
      </div>
    </div>
    <button
      onClick={onRetry}
      disabled={isConnecting}
      className="px-6 py-3 bg-slate-900 text-white hover:bg-slate-700 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
    >
      {isConnecting ? <><RotateCcw size={14} className="animate-spin" /> Querying...</> : <><RotateCcw size={14} /> Retry Hardware Connect</>}
    </button>
  </div>
);

const SuccessState = ({ onProceed, onRetake }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-100">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring' }}
      className="w-28 h-28 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-center mb-8 shadow-sm rotate-3"
    >
      <CheckCircle2 size={52} className="text-emerald-500 -rotate-3" />
    </motion.div>
    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Identity Verified</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-10 font-medium">
      Verification complete. Security metadata signature generated and stored.
    </p>
    <div className="flex gap-4 w-full max-w-sm">
      <button
        onClick={onRetake}
        className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-widest transition-all"
      >
        Retake
      </button>
      <button
        onClick={onProceed}
        className="flex-1 py-3.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02]"
      >
        Proceed <ArrowRight size={14} />
      </button>
    </div>
  </div>
);

/* ─────────────── Main Component ─────────────── */

export default function IDVerification() {
  const { examId } = useParams();
  const navigate   = useNavigate();

  const [step,          setStep]          = useState(1);
  const [stream,        setStream]        = useState(null);
  const [error,         setError]         = useState(null);
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [isConnecting,  setIsConnecting]  = useState(false);
  const [modelsLoaded,  setModelsLoaded]  = useState(false);
  const [faceBox,       setFaceBox]       = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [camError,      setCamError]      = useState(false);
  const [isUploading,   setIsUploading]   = useState(false);

  const videoRef  = useRef(null);
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
      setCamError(false);
    } catch (err) {
      console.error('Camera access failed:', err);
      api.post('/telemetry/log', {
        errorType: 'CAMERA_DENIED', severity: 'high',
        message: `ID Verification camera access failed: ${err.message}`,
        metadata: { examId, errorName: err.name }
      }).catch(() => {});
      setError({
        title:   err.name === 'NotAllowedError' ? 'Permission Denied' : 'Hardware Error',
        message: err.name === 'NotAllowedError'
          ? 'Browser blocked camera access. Please click the lock icon in your URL bar, allow "Camera", and click Retry.'
          : 'Could not detect a functional camera. Please check your hardware connections.',
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
      } catch (err) { console.warn('AI engine failed', err); }
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
      if (videoRef.current.srcObject !== stream) videoRef.current.srcObject = stream;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) playPromise.catch(err => console.warn('Auto-play blocked.', err));
    }
  }, [stream, step, error, capturedPhoto]);

  // Face Detection Loop
  useEffect(() => {
    if (!stream || !modelsLoaded || step !== 1 || capturedPhoto) return;
    let frameId;
    const loop = async () => {
      if (videoRef.current?.readyState === 4) {
        const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }));
        if (det) {
          const v = videoRef.current, c = v.parentElement;
          const s = Math.max(c.clientWidth / v.videoWidth, c.clientHeight / v.videoHeight);
          const ox = (c.clientWidth  - v.videoWidth  * s) / 2;
          const oy = (c.clientHeight - v.videoHeight * s) / 2;
          const b = det.box;
          setFaceBox({
            x: c.clientWidth - (b.x * s + b.width * s + ox) - b.width * s * 0.15,
            y: b.y * s + oy - b.height * s * 0.3,
            width:  b.width  * s * 1.3,
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
      const v = videoRef.current, c = canvasRef.current;
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      setCapturedPhoto(c.toDataURL('image/jpeg', 0.9));
      setIsProcessing(false);
    }, 800);
  };

  const confirmPhoto = async () => {
    setIsUploading(true);
    try {
      const res  = await fetch(capturedPhoto);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, `${step === 1 ? 'face' : 'id'}_${Date.now()}.jpg`);
      const endpoint = step === 1 ? '/api/upload/profile' : '/api/upload/id-card';
      await api.post(endpoint, formData, { headers: { 'Content-Type': undefined } });
      setCapturedPhoto(null);
      if (step === 1) { setStep(2); } else { setStep(3); if (stream) stream.getTracks().forEach(t => t.stop()); }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Please retake.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#FFFFFF] font-sans flex flex-col overflow-hidden text-slate-700">
      <Navbar role="Student" hideSignOut />

      {/* Subtle background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 pt-24 pb-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 min-h-0 relative z-10">

        {/* ── Sidebar ── */}
        <aside className="h-full flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">

          {/* Brand card */}
          <div className="bg-[#F5F5F5] rounded-2xl p-6 border border-slate-200 flex flex-col items-center text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 mb-4 flex items-center justify-center relative">
              <ScanFace size={24} />
              <div className="absolute inset-0 rounded-2xl border border-slate-400 animate-ping opacity-10" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1.5">Gatekeeper</h2>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Scan biometric identifiers to initialize secure exam environment.
            </p>
          </div>

          {/* Steps */}
          <div className="flex-1 flex flex-col bg-[#F5F5F5] rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-5">
              Identity Verification Pipeline
            </h3>
            <StepIndicator step={step} />
          </div>
        </aside>

        {/* ── Camera Section ── */}
        <section className="h-full bg-[#F5F5F5] rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {error ? (
            <ErrorState error={error} onRetry={startCamera} isConnecting={isConnecting} />
          ) : step < 3 ? (
            <div className="flex-1 relative rounded-xl overflow-hidden flex flex-col border border-slate-800" style={{ backgroundColor: '#000000' }}>

              {/* Video Area */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6">
                <div className="relative w-full max-w-[800px] aspect-video rounded-2xl overflow-hidden border border-[#222] shadow-2xl group" style={{ backgroundColor: '#000000' }}>

                  {capturedPhoto ? (
                    <img src={capturedPhoto} alt="Captured preview" className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${step === 1 ? 'scale-x-[-1]' : ''}`} />
                  ) : stream ? (
                    <video
                      ref={videoRef} autoPlay playsInline muted
                      disablePictureInPicture disableRemotePlayback
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isProcessing ? 'opacity-30 blur-xl' : 'opacity-100'} ${step === 1 ? 'scale-x-[-1]' : ''}`}
                    />
                  ) : null}

                  {/* Refined Identity Guides */}
                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
                    {/* Dimmed background around the cutout */}
                    <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
                    
                    {!capturedPhoto && step === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative w-[32vh] h-[45vh] sm:w-[35vh] sm:h-[48vh] border-[2.5px] border-white/80 rounded-[100%] border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] z-20"
                      />
                    )}
                    
                    {!capturedPhoto && step === 2 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative w-[60vh] h-[38vh] border-[2.5px] border-white/80 rounded-2xl border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] z-20"
                      />
                    )}
                  </div>

                  {/* Processing overlay */}
                  <AnimatePresence>
                    {isProcessing && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-2 border-t-emerald-400 border-white/10 rounded-full animate-spin mb-3" />
                        <span className="text-[9px] font-black text-emerald-400 tracking-[0.3em] uppercase">Processing Identity</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Live badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Secure Feed</span>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Bottom Control Bar */}
              <div className="h-[90px] bg-white border-t border-slate-200 flex items-center justify-between px-8 z-40 shrink-0">
                <div className="flex items-center gap-3.5 text-slate-500 w-1/3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {step === 1 ? <UserCircle2 size={18} className="text-slate-700" /> : <CreditCard size={18} className="text-slate-700" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      {step === 1 ? 'Step 1: Student Photo' : 'Step 2: ID Card'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 leading-tight">
                      {step === 1 ? 'Position your face inside the oval.' : 'Make sure your ID is well-lit and readable.'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center flex-1">
                  {!capturedPhoto && (
                    <button onClick={capture} disabled={!stream || isProcessing}
                      className="w-14 h-14 rounded-full border-[3px] border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all disabled:opacity-50 group">
                      <div className="w-11 h-11 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors flex items-center justify-center text-white">
                        <Camera size={18} />
                      </div>
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5 w-1/3 justify-end items-center">
                  {capturedPhoto ? (
                    <>
                      <button onClick={() => setCapturedPhoto(null)} disabled={isProcessing || isUploading}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-[11px] font-bold uppercase tracking-wide flex items-center gap-2 transition-all">
                        <RotateCcw size={14} /> Retake
                      </button>
                      <button onClick={confirmPhoto} disabled={isProcessing || isUploading}
                        className="px-7 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wide flex items-center gap-2 transition-all disabled:opacity-60 shadow-sm">
                        {isUploading ? <><Loader2 size={14} className="animate-spin" /> Uploading</> : <>Confirm <CheckCircle2 size={14} /></>}
                      </button>
                    </>
                  ) : (
                    <>
                      {step === 2 && (
                        <button onClick={() => setStep(1)} disabled={isProcessing}
                          className="px-5 py-2.5 rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-[11px] font-bold uppercase tracking-wide transition-all">
                          Back
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <SuccessState
              onProceed={() => navigate(`/exam/${examId}/waiting`)}
              onRetake={() => { setStep(1); startCamera(); }}
            />
          )}
        </section>
      </main>

      {/* Exit FAB — Global Candidate Style */}
      <button
        onClick={() => navigate('/student')}
        title="Exit to Dashboard"
        className="fixed bottom-6 right-6 z-[90] w-[52px] h-[52px] bg-white border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-lg transition-all active:scale-95 group"
      >
        <Power size={20} className="stroke-[2.5px]" />
      </button>
    </div>
  );
}
