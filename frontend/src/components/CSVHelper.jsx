import React from 'react';
import { HelpCircle } from 'lucide-react';

const CSVHelper = ({ format, example }) => {
  return (
    <div className="relative group">
      {/* Trigger Button — matches admin flat button style */}
      <div className="w-10 h-10 rounded-xl bg-surface border border-main flex items-center justify-center text-muted hover:text-primary hover:bg-surface-hover cursor-help transition-all">
        <HelpCircle size={16} strokeWidth={2} />
      </div>

      {/* Tooltip Popover */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-surface rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-[100] pointer-events-none"
        style={{ border: '1px solid #1f1f1f' }}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            CSV Format
          </p>

          {/* Format block */}
          {format && (
            <div className="bg-surface-hover rounded-xl px-3 py-2.5" style={{ border: '1px solid #1f1f1f' }}>
              <code className="text-[11px] font-mono text-primary break-all leading-relaxed">
                {format}
              </code>
            </div>
          )}

          {/* Example block */}
          {example && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Example
              </p>
              <p className="text-[11px] font-mono text-muted/70 break-all leading-relaxed">
                {example}
              </p>
            </div>
          )}
        </div>

        {/* Caret arrow */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1f1f1f',
          }}
        />
      </div>
    </div>
  );
};

export default CSVHelper;
