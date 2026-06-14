 import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function CodeEditor({ value, onChange, language = 'javascript', readOnly = false, className }) {
  const textareaRef = useRef(null);
  const lineCountRef = useRef(null);

  const lines = (value || '').split('\n');
  const lineCount = lines.length;

  useEffect(() => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [value]);

  const handleScroll = () => {
    if (lineCountRef.current && textareaRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={cn('relative rounded-lg border border-border bg-[hsl(222,47%,4%)] overflow-hidden', className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
      </div>

      <div className="flex">
        {/* Line numbers */}
        <div
          ref={lineCountRef}
          className="select-none py-3 px-3 text-right text-xs font-mono text-muted-foreground/50 leading-[1.6] overflow-hidden border-r border-border/50 bg-secondary/20"
          style={{ minWidth: '3rem' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          className="flex-1 bg-transparent text-emerald-300 font-mono text-sm leading-[1.6] p-3 resize-none outline-none min-h-[300px] placeholder:text-muted-foreground/30"
          placeholder="// Paste your code here for analysis..."
        />
      </div>
    </div>
  );
}
