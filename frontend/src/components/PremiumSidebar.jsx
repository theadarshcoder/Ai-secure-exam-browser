import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import VisionLogo from './VisionLogo';

/* ─────────────────────────────────────────────────────────
   PremiumSidebar — Veelov-style collapsible sidebar
   - Collapsed: narrow icon-only strip with rounded icon cards
   - Expanded: full labels with smooth Framer Motion spring
   - Toggle button floats on the right edge
   ───────────────────────────────────────────────────────── */

const COLLAPSED_W = 76;
const EXPANDED_W = 260;

export default function PremiumSidebar({
  navItems = [],
  activeTab,
  setActiveTab,
  userName = '',
  userRole = '',
  onLogout,
  brandLabel = 'VISION',
  expanded: controlledExpanded,
  onToggle,
}) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggleSidebar = () => {
    if (onToggle) onToggle(!expanded);
    else setInternalExpanded(!internalExpanded);
  };
  const [hoveredId, setHoveredId] = useState(null);

  const sidebarVariants = {
    expanded: {
      width: EXPANDED_W,
      transition: { type: 'spring', stiffness: 320, damping: 32, mass: 0.8 },
    },
    collapsed: {
      width: COLLAPSED_W,
      transition: { type: 'spring', stiffness: 320, damping: 32, mass: 0.8 },
    },
  };

  const labelVariants = {
    show: { opacity: 1, x: 0, transition: { delay: 0.06, duration: 0.18 } },
    hide: { opacity: 0, x: -8, transition: { duration: 0.1 } },
  };

  const brandLabelVariants = {
    show: { opacity: 1, width: 'auto', transition: { delay: 0.08, duration: 0.18 } },
    hide: { opacity: 0, width: 0, transition: { duration: 0.1 } },
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={expanded ? 'expanded' : 'collapsed'}
      initial={false}
      className="relative shrink-0 flex flex-col z-30 overflow-visible"
      style={{
        background: '#FAFAFA',
        borderRight: '1px solid #F0F0F0',
        height: '100vh',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Toggle Button ── */}
      <motion.button
        onClick={toggleSidebar}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'absolute',
          top: 68,
          right: -14,
          zIndex: 50,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '1.5px solid #E8E8E8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#888',
        }}
      >
        <motion.span
          animate={{ rotate: expanded ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </motion.span>
      </motion.button>

      {/* ── Brand ── */}
      <div
        style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          padding: expanded ? '0 20px' : '0 0',
          justifyContent: expanded ? 'flex-start' : 'center',
          flexShrink: 0,
          overflow: 'hidden',
          borderBottom: '1px solid #F5F5F5',
        }}
      >
        {/* Logo icon box */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#111111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <VisionLogo className="w-[20px] h-[20px] text-white" />
        </div>

        {/* Brand text */}
        <AnimatePresence>
          {expanded && (
            <motion.span
              variants={brandLabelVariants}
              initial="hide"
              animate="show"
              exit="hide"
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111',
                marginLeft: 10,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                display: 'block',
              }}
            >
              {brandLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav ── */}
      <nav
        onMouseLeave={() => setHoveredId(null)}
        style={{
          flex: 1,
          padding: expanded ? '12px 10px' : '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Faint Continuous Track Line (like Animate UI) */}
          <div style={{
            position: 'absolute',
            left: expanded ? 9 : 5,
            top: 4,
            bottom: 4,
            width: 1,
            background: '#E5E7EB',
            zIndex: 0,
          }} />
          
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredId === item.id;
          const IconComp = item.icon;

          return (
            <div
              key={item.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredId(item.id)}
            >
              {/* Externalized Hover Slider Pill */}
              {isHovered && (
                <motion.div
                  layoutId="hoverTracker"
                  style={{
                    position: 'absolute',
                    left: expanded ? 8 : 4,
                    top: '15%',
                    bottom: '15%',
                    width: 3,
                    borderRadius: 3,
                    background: '#CBD5E1',
                    zIndex: 8,
                  }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.8 }}
                />
              )}

              {/* Externalized Active Tracking Pill */}
              {isActive && (
                <motion.div
                  layoutId="verticalTracker"
                  style={{
                    position: 'absolute',
                    left: expanded ? 8 : 4,
                    top: '15%',
                    bottom: '15%',
                    width: 3,
                    borderRadius: 3,
                    background: '#111111',
                    zIndex: 10,
                  }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.8 }}
                />
              )}

              <motion.button
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.96 }}
                title={!expanded ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: expanded ? '6px 12px' : '10px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  transition: 'background 0.15s ease',
                  outline: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Icon container */}
                <motion.div
                  animate={{
                    background: 'transparent',
                  }}
                  transition={{ duration: 0.15 }}
                  style={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <motion.span
                    animate={{ color: isActive ? '#111111' : isHovered ? '#374151' : '#6B7280' }}
                    transition={{ duration: 0.15 }}
                  >
                    <IconComp size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  </motion.span>
                </motion.div>

                {/* Label */}
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      variants={labelVariants}
                      initial="hide"
                      animate="show"
                      exit="hide"
                      style={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 450,
                        color: isActive ? '#1E1E2E' : '#6B7280',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        textAlign: 'left',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Badge */}
                {item.badge != null && item.badge > 0 && (
                  <motion.span
                    animate={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      background: '#EF4444',
                      color: '#FFF',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </motion.button>

            </div>
          );
        })}
        </div>
      </nav>

      {/* ── Bottom: User + Logout ── */}
      {/* ── Bottom: User + Logout ── */}
      <div
        style={{
          padding: expanded ? '12px 12px 16px' : '12px 8px 16px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* User info */}
        <div 
          className="flex items-center gap-3 cursor-pointer group rounded-xl hover:bg-slate-50 transition-all" 
          style={{ padding: expanded ? '8px' : '8px 0', justifyContent: expanded ? 'flex-start' : 'center' }}
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-slate-700 uppercase text-[11px] shadow-sm group-hover:border-[#4ade80] transition-all shrink-0">
            {userName.charAt(0)}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                variants={labelVariants}
                initial="hide"
                animate="show"
                exit="hide"
                className="overflow-hidden"
              >
                <p className="text-[10px] font-black text-slate-900 group-hover:text-[#22c55e] transition-colors uppercase tracking-tight leading-none">
                  {userName}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                  {userRole.replace('_', ' ')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <motion.button
          onClick={onLogout}
          whileHover={{ background: '#FFF1F2' }}
          whileTap={{ scale: 0.96 }}
          className="group/logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: expanded ? '8px 10px' : '8px 0',
            justifyContent: expanded ? 'flex-start' : 'center',
            borderRadius: 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#64748B',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div className="flex items-center justify-center flex-shrink-0 group-hover/logout:text-red-500 transition-colors">
            <LogOut size={16} strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                variants={labelVariants}
                initial="hide"
                animate="show"
                exit="hide"
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/logout:text-red-600 transition-colors whitespace-nowrap"
              >
                Log Out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
