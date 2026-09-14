'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import {
  THEMES,
  THEME_BACKDROPS,
  THEME_LABELS,
  THEME_SWATCHES,
  useTheme,
} from './ThemeContext';

/**
 * Theme switcher in the sidebar footer.
 *
 * Each option previews as an accent dot on that theme's actual background,
 * rather than a bare accent square — the old version showed six coloured
 * chips that told you nothing about whether a theme was light or dark.
 */
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
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-sm text-stage-muted transition-colors hover:bg-stage-panel2 hover:text-stage-text"
      >
        <Icon name="palette" size={17} />
        <span className="flex-1 text-left">Theme</span>
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border border-stage-border"
          style={{ backgroundColor: THEME_SWATCHES[theme] }}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose a theme"
          className="absolute bottom-full left-0 z-30 mb-1 w-full overflow-hidden rounded-lg border border-stage-border bg-stage-panel shadow-pop"
        >
          {THEMES.map((t) => {
            const active = t === theme;
            return (
              <button
                key={t}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(t);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-stage-accentSoft/15 text-stage-accent'
                    : 'text-stage-muted hover:bg-stage-panel2 hover:text-stage-text'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-stage-border"
                  style={{ backgroundColor: THEME_BACKDROPS[t] }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: THEME_SWATCHES[t] }}
                  />
                </span>
                <span className="flex-1 text-left">{THEME_LABELS[t]}</span>
                {active && <Icon name="check" size={14} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
