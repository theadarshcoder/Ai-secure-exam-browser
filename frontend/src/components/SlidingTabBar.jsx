import React from 'react';
import { motion } from 'framer-motion';

/**
 * SlidingTabBar — animated sliding pill tab switcher.
 * Uses CSS variables via Tailwind classes to automatically adapt to light/dark themes.
 *
 * @param {Array}    tabs       - Array of { id, label } objects
 * @param {string}   active     - Currently active tab id
 * @param {Function} onChange   - (id) => void
 * @param {string}   layoutId   - Unique layoutId for framer-motion (must be unique per page if multiple bars exist)
 */
export default function SlidingTabBar({ tabs, active, onChange, layoutId = 'sliding-tab' }) {
  return (
    <div className="inline-flex items-center gap-2 relative">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            data-text={tab.label}
            className={`relative py-1 px-1 border-none bg-transparent cursor-pointer text-[13px] tracking-[-0.01em] transition-colors z-10 whitespace-nowrap outline-none focus:outline-none focus:ring-0 prevent-layout-shift ${
              isActive ? 'text-primary font-semibold' : 'text-muted font-medium hover:text-primary'
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
