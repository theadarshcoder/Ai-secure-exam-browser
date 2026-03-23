import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import NoiseOverlay from './NoiseOverlay';
import NetworkBanner from './NetworkBanner';
import CommandPalette from './CommandPalette';

const MainLayout = () => {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
      
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleGesture = (e) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('gesturestart', handleGesture);
    window.addEventListener('gesturechange', handleGesture);
    window.addEventListener('gestureend', handleGesture);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('gesturestart', handleGesture);
      window.removeEventListener('gesturechange', handleGesture);
      window.removeEventListener('gestureend', handleGesture);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 relative">
      <NoiseOverlay />
      <NetworkBanner />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
