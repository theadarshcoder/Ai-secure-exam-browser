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
      <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-white/90 border-b border-slate-200 shadow-sm top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12 sm:h-14 items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative flex items-center justify-center">
                <VisionLogo className="w-7 h-7 text-slate-900" />
              </div>
              <span className="text-sm sm:text-base font-bold tracking-[0.2em] text-slate-900 mt-0.5">VISION</span>
              {role && (
                <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-bold tracking-widest uppercase hidden sm:block mt-0.5">
                  {role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!role && (
                <div className="hidden md:flex space-x-8 mr-6">
                  <a href="#" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Features</a>
                  <a href="#" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Integrations</a>
                  <a href="#" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Pricing</a>
                </div>
              )}
              
              {role && !hideSignOut && role !== 'Student' && (
                <button
                  className="bg-transparent border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-[0.98]"
                  onClick={() => setShowSignOutConfirm(true)}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              )}
              {role !== 'Student' && <ThemeToggle />}
              
              {!role && (
                <div className="hidden md:flex flex-row gap-3">
                  <button onClick={() => navigate('/login')} className="text-slate-500 hover:text-slate-900 font-bold text-xs transition-colors px-3 py-1.5">
                    Log In
                  </button>
                  <button
                    className="bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98]"
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
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <LogOut size={20} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm Sign Out</h3>
                  <p className="text-slate-500 text-sm">Are you sure you want to sign out?</p>
                </div>
              </div>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-slate-600 text-sm mb-6 font-medium">
              This will clear your session and redirect you to the home page. Any unsaved work will be lost.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
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
