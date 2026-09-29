'use client';

import { useCallback, useEffect, useState } from 'react';

// Collapsed/expanded state of the desktop sidebar.
//
// The source of truth is a `data-sidebar` attribute on <html>, set before
// first paint by the init script in app/layout.tsx (from localStorage), and
// the layout itself is driven by CSS on that attribute (see globals.css).
// That way the page never renders at the wrong width and then jumps — this
// hook only mirrors the attribute into React state for the toggle button.

export const SIDEBAR_STORAGE_KEY = 'apc-sidebar';

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(document.documentElement.getAttribute('data-sidebar') === 'collapsed');
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-sidebar', next ? 'collapsed' : 'expanded');
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'collapsed' : 'expanded');
      } catch {
        // Private mode / blocked storage: still works for this visit.
      }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
