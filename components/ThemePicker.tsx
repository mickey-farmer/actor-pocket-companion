'use client';

import { useEffect, useRef, useState } from 'react';
import { THEMES, THEME_LABELS, THEME_SWATCHES, useTheme } from './ThemeContext';

// A single square showing the current theme's accent color. Click it to
// reveal the other five as a small row of swatches to pick from.
export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Theme: ${THEME_LABELS[theme]}. Tap to change.`}
        aria-expanded={open}
        className="h-6 w-6 rounded border border-stage-border"
        style={{ backgroundColor: THEME_SWATCHES[theme] }}
      />
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 flex gap-1.5 rounded-lg border border-stage-border bg-stage-panel p-2 shadow-lg">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTheme(t);
                setOpen(false);
              }}
              aria-label={THEME_LABELS[t]}
              title={THEME_LABELS[t]}
              className={`h-6 w-6 rounded border-2 transition-transform ${
                t === theme ? 'border-stage-accent scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: THEME_SWATCHES[t] }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
