// Minimal offline cache for Actor Pocket Companion.
//
// Scope, on purpose: this only makes already-viewed pages and read-only GET
// data (script list/detail, scene analysis, auditions) available offline.
// It never intercepts non-GET requests, so chat, login/logout, notes saves,
// and audition create/update/delete all still require a real connection —
// caching a stale AI response or silently "succeeding" a save that never
// reached the server would be worse than just failing loudly offline.

const CACHE_VERSION = 'v1';
const RUNTIME_CACHE = `apc-runtime-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('apc-runtime-') && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never touch mutations

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/login') || url.pathname.startsWith('/api/logout')) return;

  // Content-hashed build assets and icons never change under the same URL,
  // so cache-first is both safe and faster.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Everything else — pages, client-side RSC navigation fetches, and
  // read-only API GETs (scripts, scene analysis, auditions) — prefer a
  // live network response, but fall back to whatever was cached the last
  // time you had a signal.
  event.respondWith(networkFirst(request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await networkPromise) || new Response('Offline', { status: 503 });
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      'You appear to be offline and this has not been viewed yet, so there is nothing saved to show.',
      { status: 503, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}
