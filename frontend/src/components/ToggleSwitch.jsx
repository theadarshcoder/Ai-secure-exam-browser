import { motion } from 'framer-motion';

/**
 * ToggleSwitch — Premium animated switch with spring physics + glow.
 *
 * Props:
 *   checked  {boolean}  — current on/off state
 *   onChange {fn}       — called with no args when clicked
 *   size     {'sm'|'md'}— optional size (default 'md')
 *   disabled {boolean}  — optional disabled state
 */
const ToggleSwitch = ({ checked, onChange, size = 'md', disabled = false }) => {
  const isSmall = size === 'sm';

  const track = isSmall
    ? { width: 36, height: 20, radius: 10, pad: 2 }
    : { width: 44, height: 24, radius: 12, pad: 2 };

  const thumb = isSmall
    ? { size: 16 }
    : { size: 20 };

  const travel = track.width - thumb.size - track.pad * 2;

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      whileTap={{ scale: 0.92 }}
      style={{
        width: track.width,
        height: track.height,
        borderRadius: track.radius,
        padding: track.pad,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        flexShrink: 0,
        outline: 'none',
        opacity: disabled ? 0.45 : 1,
      }}
      animate={{
        backgroundColor: checked ? '#10b981' : '#d1d5db',
        boxShadow: checked
          ? '0 0 0 3px rgba(16,185,129,0.18), 0 2px 8px rgba(16,185,129,0.25)'
          : '0 1px 3px rgba(0,0,0,0.10)',
      }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
    >
      <motion.div
        style={{
          width: thumb.size,
          height: thumb.size,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute',
          top: track.pad,
          left: track.pad,
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
        animate={{ x: checked ? travel : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }}
      />
    </motion.button>
  );
};

export default ToggleSwitch;
