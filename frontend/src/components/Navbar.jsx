import React, { useState } from 'react';
import { Shield, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VisionLogo from './VisionLogo';
import { ThemeToggle } from '../contexts/ThemeContext';

export function Navbar({ role, hideSignOut }) {
  const navigate = useNavigate();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSignOut = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate('/');
  };

  return (
    <>
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
                  onClick={() => setShowSignOutConfirm(true)}
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

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <LogOut size={20} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirm Sign Out</h3>
                  <p className="text-slate-400 text-sm">Are you sure you want to sign out?</p>
                </div>
              </div>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-slate-300 text-sm mb-6">
              This will clear your session and redirect you to the home page. Any unsaved work will be lost.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
