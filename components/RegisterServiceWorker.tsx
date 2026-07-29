'use client';

import { useEffect } from 'react';

// Registers the offline-cache service worker once, on first client mount.
// No UI of its own — just plumbing.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline caching is a nice-to-have; if registration fails (e.g. an
      // unsupported browser) the app should keep working normally online.
    });
  }, []);

  return null;
}
