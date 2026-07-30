// Inert stand-in for Next.js's own vendored ua-parser-js
// (node_modules/next/dist/compiled/ua-parser-js), used only when bundling
// for the Edge runtime — see next.config.js.
//
// `next/server` unconditionally requires this module (via
// next/dist/server/web/spec-extension/user-agent.js) the moment anything
// is imported from 'next/server', even if the importing code never calls
// userAgent()/isBot()/userAgentFromString(). The real module references
// the Node-only `__dirname` global at its top level, which the Edge
// runtime doesn't provide, so it throws
// "ReferenceError: __dirname is not defined" instantly on every request
// (see https://github.com/vercel/next.js/issues/53968).
//
// This app never calls userAgent()/isBot()/userAgentFromString(), so
// swapping in a harmless no-op parser for the Edge bundle only is safe.
// If that ever changes, this stub will need real parsing logic (or the
// alias in next.config.js should be removed and a real fix pursued).
module.exports = function parseUserAgent(uaString) {
  return {
    ua: uaString || '',
    browser: {},
    cpu: {},
    device: {},
    engine: {},
    os: {},
  };
};
