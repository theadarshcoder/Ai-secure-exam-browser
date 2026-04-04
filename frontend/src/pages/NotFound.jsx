import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { WifiOff, Home, ArrowLeft, ShieldAlert } from 'lucide-react';
import VisionLogo from '../components/VisionLogo';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-[#0a0c10] flex items-center justify-center font-sans relative overflow-hidden text-slate-200">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="relative z-10 max-w-lg w-full px-6 text-center">
        <Motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                <WifiOff size={48} />
              </div>
              <Motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500"
              >
                <ShieldAlert size={16} />
              </Motion.div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            Error Code: 404_UPLINK_LOST
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-4 uppercase">
            Route Not <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Found</span>
          </h1>
          
          <p className="text-slate-500 text-sm mb-12 leading-relaxed font-semibold max-w-sm mx-auto">
            The requested coordinates are outside our secure perimeter. Your session remains protected, but this uplink has been severed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/5 bg-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Previous Node
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-[#0a0c10] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
            >
              <Home size={16} /> Return to Base
            </button>
          </div>
        </Motion.div>

        <div className="mt-20 pt-8 border-t border-white/[0.03] flex items-center justify-center gap-8">
           <div className="flex items-center gap-2 opacity-30 grayscale">
             <VisionLogo className="w-4 h-4" />
             <span className="text-[10px] font-black tracking-widest uppercase">VISION SYSTEM</span>
           </div>
        </div>
      </div>
    </div>
  );
}
