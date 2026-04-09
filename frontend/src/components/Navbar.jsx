import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VisionLogo from './VisionLogo';
import { ThemeToggle } from '../contexts/ThemeContext';

export function Navbar({ role, hideSignOut }) {
  const navigate = useNavigate();
  return (
    <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.3)] top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12 sm:h-14 items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="relative flex items-center justify-center">
              <VisionLogo className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-[0.2em] text-white mt-0.5">VISION</span>
            {role && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-bold tracking-widest uppercase hidden sm:block mt-0.5">
                {role}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!role && (
              <div className="hidden md:flex space-x-8 mr-6">
                <a href="#" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Features</a>
                <a href="#" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Integrations</a>
                <a href="#" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Pricing</a>
              </div>
            )}
            
            {role && !hideSignOut && (
              <button 
                className="bg-transparent border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-[0.98]" 
                onClick={() => {
                  sessionStorage.clear();
                  localStorage.clear();
                  navigate('/');
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            )}
            <ThemeToggle />
            
            {!role && (
              <div className="hidden md:flex flex-row gap-3">
                <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white font-bold text-xs transition-colors px-3 py-1.5">
                  Log In
                </button>
                <button 
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 transition-all active:scale-[0.98]" 
                  onClick={() => navigate('/login')}
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
