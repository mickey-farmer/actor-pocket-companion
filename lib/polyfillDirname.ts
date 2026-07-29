// Works around a known Next.js bug (vercel/next.js#53968): merely
// importing `next/server` in a middleware file can pull in Next's own
// vendored copy of ua-parser-js, which references the Node.js-only
// `__dirname` global at module scope. The Edge Runtime doesn't provide
// `__dirname`, so this throws "ReferenceError: __dirname is not defined"
// the moment `next/server` is loaded — before our own middleware code ever
// runs, which is why wrapping middleware() in try/catch doesn't help.
//
// This has nothing to do with our own code; it's Next.js's internal
// bundling. The fix: polyfill a harmless placeholder value for
// `__dirname` in its own side-effect-only module, and import *that*
// before `next/server`. ES module imports execute in source order, so as
// long as this import comes first in middleware.ts, it runs before
// next/server's module body (and therefore before ua-parser-js) does.
declare global {
  // eslint-disable-next-line no-var
  var __dirname: string | undefined;
}

if (typeof globalThis.__dirname === 'undefined') {
  globalThis.__dirname = '/';
}

export {};
