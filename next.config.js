/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  // Next.js's own webpack config explicitly disables webpack's normal
  // __dirname substitution for the Edge runtime bundle (since Edge has no
  // real filesystem). But `next/server` unconditionally pulls in a vendored
  // ua-parser-js that references bare `__dirname` at module scope, which
  // then throws `ReferenceError: __dirname is not defined` the moment
  // middleware runs on Vercel. Re-enabling webpack's __dirname shim just
  // for the edge target fixes this without touching middleware's runtime
  // or package.json's module type.
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.node = {
        ...config.node,
        __dirname: true,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
