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
// Deliberately using `as any` here instead of a `declare global { var __dirname }`
// ambient declaration — @types/node already declares `__dirname` globally as
// `string` (non-optional), and redeclaring it as `string | undefined` in this
// file conflicts with that existing declaration ("Subsequent variable
// declarations must have the same type"). Going through `any` sidesteps the
// clash entirely without touching @types/node's declaration.
if (typeof (globalThis as any).__dirname === 'undefined') {
  (globalThis as any).__dirname = '/';
}

export {};
