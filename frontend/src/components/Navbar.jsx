import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Navbar({ role }) {
  const navigate = useNavigate();
  return (
    <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-white/70 border-b border-slate-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.02)] top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 shadow-sm border border-primary-100/50">
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0f172a]">Procto<span className="text-[#6366f1]">Shield</span></span>
            {role && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold tracking-wider uppercase hidden sm:block">
                {role}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!role && (
              <div className="hidden md:flex space-x-8 mr-6">
                <a href="#" className="text-sm font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors">Features</a>
                <a href="#" className="text-sm font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors">Integrations</a>
                <a href="#" className="text-sm font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors">Pricing</a>
              </div>
            )}
            
            {role ? (
              <button 
                className="bg-transparent border border-slate-200 text-[#64748b] hover:bg-slate-50 hover:text-[#0f172a] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98]" 
                onClick={() => navigate('/')}
              >
                <LogOut size={16} /> Sign Out
              </button>
            ) : (
              <div className="hidden md:flex flex-row gap-3">
                <button onClick={() => navigate('/login')} className="text-[#64748b] hover:text-[#0f172a] font-bold text-sm transition-colors px-4 py-2">
                  Log In
                </button>
                <button 
                  className="bg-[#6366f1] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 transition-all active:scale-[0.98]" 
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
