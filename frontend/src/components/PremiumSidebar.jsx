import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import VisionLogo from './VisionLogo';
import { useTheme } from '../contexts/ThemeContext';

/* ─────────────────────────────────────────────────────────
   PremiumSidebar — Veelov-style collapsible sidebar
   - Collapsed: narrow icon-only strip with rounded icon cards
   - Expanded: full labels with smooth Framer Motion spring
   - Toggle button floats on the right edge
   ───────────────────────────────────────────────────────── */

const COLLAPSED_W = 76;
const EXPANDED_W = 220;

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

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const toggleSidebar = () => {
    if (onToggle) onToggle(!expanded);
    else setInternalExpanded(!internalExpanded);
  };
  const [hoveredId, setHoveredId] = useState(null);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Colors based on Slash.com / Modern SaaS aesthetics
  const colors = {
    bg: 'var(--bg-surface)',
    border: 'var(--border-main)',
    itemActive: 'var(--text-primary)',
    itemHover: 'var(--text-primary)',
    itemDefault: 'var(--text-secondary)',
    textActive: 'var(--text-primary)',
    textDefault: 'var(--text-secondary)',
    brandText: 'var(--text-primary)',
    toggleBg: 'var(--bg-surface)',
    toggleBorder: 'var(--border-main)',
  };

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
      className="relative shrink-0 flex flex-col h-full z-30 overflow-visible"
      style={{
        background: colors.bg,
        borderRight: `1px solid ${colors.border}`,
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
          top: 42,
          right: -14,
          zIndex: 50,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: colors.toggleBg,
          border: `1.5px solid ${colors.toggleBorder}`,
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.10)',
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
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: expanded ? '0 20px' : '0 0',
          justifyContent: expanded ? 'flex-start' : 'center',
          flexShrink: 0,
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-main)',
        }}
      >
        {/* Logo icon box */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <VisionLogo className="w-[24px] h-[24px] text-primary" />
        </div>

        {/* Brand text */}
        <AnimatePresence initial={false}>
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
                color: colors.brandText,
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
            background: 'var(--border-main)',
            zIndex: 0,
          }} />
          
        {navItems.map((item, idx) => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredId === item.id;
          const IconComp = item.icon;

          // Render section header if present and different from previous or first

          return (
            <React.Fragment key={item.id}>


              <div
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
                       top: '25%',
                       bottom: '25%',
                       width: 3,
                       borderRadius: 3,
                       background: 'var(--border-main)',
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
                       top: '25%',
                       bottom: '25%',
                       width: 3,
                       borderRadius: 3,
                       background: 'var(--accent-primary)',
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
                    gap: 6,
                    padding: expanded ? '8px 12px' : '8px 0',
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
                      animate={{ color: isActive ? colors.itemActive : isHovered ? colors.itemHover : colors.itemDefault }}
                      transition={{ duration: 0.15 }}
                    >
                      <IconComp size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    </motion.span>
                  </motion.div>

                  {/* Label */}
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.span
                        variants={labelVariants}
                        initial="hide"
                        animate="show"
                        exit="hide"
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? colors.textActive : colors.textDefault,
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
            </React.Fragment>
          );
        })}
        </div>
      </nav>

      {/* ── Bottom: User + Logout ── */}
      <div
        ref={profileMenuRef}
        className="relative"
        style={{
          padding: expanded ? '12px 12px 16px' : '12px 8px 16px',
          borderTop: '1px solid var(--border-main)',
        }}
       >
         {/* Floating Logout Popover */}
         <AnimatePresence>
           {showProfileMenu && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 8 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 8 }}
               transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
               className="absolute bottom-[calc(100%+4px)] left-2 right-2 z-50 origin-bottom"
             >
               <button 
                 onClick={onLogout}
                 className="w-full flex items-center px-3 py-2.5 bg-surface border border-main rounded-xl shadow-lg hover:border-red-500/30 hover:bg-red-500/5 group/btn transition-all active:scale-95 overflow-hidden"
                 style={{ justifyContent: expanded ? 'flex-start' : 'center' }}
               >
                 <div className="flex items-center gap-2.5">
                   <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center group-hover/btn:bg-red-500/20 transition-colors shrink-0">
                     <LogOut size={13} className="text-red-500" strokeWidth={2.5} />
                   </div>
                   <AnimatePresence>
                     {expanded && (
                       <motion.span 
                         variants={labelVariants}
                         initial="hide"
                         animate="show"
                         exit="hide"
                         className="text-[10px] font-black uppercase tracking-widest text-primary group-hover/btn:text-red-500 transition-colors whitespace-nowrap"
                       >
                         Sign Out
                       </motion.span>
                     )}
                   </AnimatePresence>
                 </div>
               </button>
             </motion.div>
           )}
         </AnimatePresence>

         {/* User info */}
         <div 
           onClick={() => setShowProfileMenu(!showProfileMenu)}
           className={`flex items-center gap-3 cursor-pointer rounded-xl transition-all hover:bg-surface border border-transparent hover:border-main hover:shadow-sm ${showProfileMenu ? 'bg-surface border-main shadow-sm' : ''}`} 
           style={{ padding: expanded ? '8px' : '8px 0', justifyContent: expanded ? 'flex-start' : 'center' }}
         >
           <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black uppercase text-[11px] shadow-sm transition-all shrink-0 bg-surface border border-main text-primary">
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
                 <p className="text-[10px] font-black transition-colors uppercase tracking-tight leading-none text-primary">
                   {userName}
                 </p>
                 <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted mt-1">
                   {userRole.replace('_', ' ')}
                 </p>
               </motion.div>
             )}
           </AnimatePresence>
         </div>
       </div>
    </motion.aside>
  );
}
