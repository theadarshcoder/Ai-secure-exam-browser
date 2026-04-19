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
}) {
  const [expanded, setExpanded] = useState(true);
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
        background: '#FFFFFF',
        borderRight: '1px solid #F0F0F0',
        height: '100vh',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Toggle Button ── */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
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
            background: '#0d9488',
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
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredId === item.id;
          const IconComp = item.icon;

          return (
            <div
              key={item.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <motion.button
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.96 }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: expanded ? '9px 12px' : '9px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive
                    ? '#EEF2FF'
                    : isHovered
                    ? '#F4F4F5'
                    : 'transparent',
                  transition: 'background 0.15s ease',
                  outline: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Animated active background pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="activeNavPill"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 12,
                        background: '#EEF2FF',
                        zIndex: 0,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon container — rounded square card */}
                <motion.div
                  animate={{
                    background: isActive ? '#4F46E5' : isHovered ? '#E4E4E7' : '#F4F4F5',
                  }}
                  transition={{ duration: 0.15 }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <motion.span
                    animate={{ color: isActive ? '#FFFFFF' : isHovered ? '#374151' : '#6B7280' }}
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

              {/* Collapsed tooltip */}
              <AnimatePresence>
                {!expanded && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.14 }}
                    style={{
                      position: 'absolute',
                      left: COLLAPSED_W - 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: '#1E1E2E',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '5px 10px',
                      borderRadius: 8,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 999,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    }}
                  >
                    {item.label}
                    {item.badge > 0 && (
                      <span style={{ marginLeft: 6, background: '#EF4444', borderRadius: 10, padding: '1px 5px', fontSize: 10 }}>
                        {item.badge}
                      </span>
                    )}
                    {/* Arrow */}
                    <span
                      style={{
                        position: 'absolute',
                        left: -5,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '5px solid transparent',
                        borderBottom: '5px solid transparent',
                        borderRight: '5px solid #1E1E2E',
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: User + Logout ── */}
      <div
        style={{
          padding: expanded ? '10px 10px 14px' : '10px 8px 14px',
          borderTop: '1px solid #F0F0F0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* User info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: expanded ? '8px 10px' : '8px 0',
            justifyContent: expanded ? 'flex-start' : 'center',
            borderRadius: 10,
            background: '#F7F7F8',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1E1E2E',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                variants={labelVariants}
                initial="hide"
                animate="show"
                exit="hide"
                style={{ overflow: 'hidden' }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  {userName}
                </p>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
                  {userRole.replace('_', ' ')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <motion.button
          onClick={onLogout}
          whileHover={{ background: '#FEF2F2' }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: expanded ? '8px 10px' : '8px 0',
            justifyContent: expanded ? 'flex-start' : 'center',
            borderRadius: 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#9CA3AF',
            fontSize: 14,
            fontWeight: 500,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <motion.div
            whileHover={{ color: '#DC2626' }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <LogOut size={17} strokeWidth={1.8} />
          </motion.div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                variants={labelVariants}
                initial="hide"
                animate="show"
                exit="hide"
                style={{ whiteSpace: 'nowrap' }}
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
