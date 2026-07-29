'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const THEMES = ['dusk', 'slate', 'pink', 'sage', 'dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  dusk: 'Dusk',
  slate: 'Slate',
  pink: 'Pink',
  sage: 'Sage',
  dark: 'Dark',
  light: 'Light',
};

// Swatch colors for the picker squares — kept in sync by hand with the
// --stage-accent-rgb values in app/globals.css for each [data-theme].
export const THEME_SWATCHES: Record<Theme, string> = {
  dusk: '#5b9bd5',
  slate: '#2dd4bf',
  pink: '#ec4899',
  sage: '#9caf88',
  dark: '#f59e0b',
  light: '#2563eb',
};

const DEFAULT_THEME: Theme = 'dusk';
const STORAGE_KEY = 'apc-theme';

function isTheme(value: string | null): value is Theme {
  return !!value && (THEMES as readonly string[]).includes(value);
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline script in app/layout.tsx already set data-theme on <html>
  // before hydration, so read it back here instead of always starting from
  // the default — avoids a flash of the wrong theme AND a mismatch.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return DEFAULT_THEME;
    const attr = document.documentElement.getAttribute('data-theme');
    return isTheme(attr) ? attr : DEFAULT_THEME;
  });

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can fail in private browsing, etc. — theme just won't
      // persist across reloads, which is fine.
    }
  }, []);

  // Keep <html data-theme> correct even if something else changes state
  // out from under us (shouldn't happen, but cheap to guard).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
