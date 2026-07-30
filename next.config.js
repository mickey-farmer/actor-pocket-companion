const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  // `next/server` unconditionally pulls in Next's own vendored ua-parser-js
  // (via server/web/spec-extension/user-agent.js), which references the
  // Node-only `__dirname` global at module scope. That throws
  // "ReferenceError: __dirname is not defined" the instant middleware runs
  // on the Edge runtime (see vercel/next.js#53968) — even though this app
  // never calls the userAgent()/isBot() helpers that module exists for.
  //
  // Re-enabling webpack's normal __dirname substitution
  // (config.node.__dirname = true) for the edge target did NOT fix this in
  // practice, so instead we alias the vendored module itself to a harmless
  // stub (lib/edgeUaParserStub.js) for the Edge bundle only, which stops
  // the crashing code from ever loading.
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.node = {
        ...config.node,
        __dirname: true,
      };
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'next/dist/compiled/ua-parser-js$': path.resolve(
          __dirname,
          'lib/edgeUaParserStub.js'
        ),
        'next/dist/compiled/ua-parser-js/ua-parser.js$': path.resolve(
          __dirname,
          'lib/edgeUaParserStub.js'
        ),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
