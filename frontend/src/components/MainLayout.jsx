import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import NetworkBanner from './NetworkBanner';
const MainLayout = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };

    const handleWheel = (e) => { e.ctrlKey && e.preventDefault(); };
    const prevent = (e) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => window.addEventListener(ev, prevent));

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => window.removeEventListener(ev, prevent));
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans selection:bg-indigo-100">
      <NetworkBanner />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
