/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfjs-dist', '@napi-rs/canvas', 'mammoth'],

  // pdfjs loads its worker through a computed dynamic import, which Next's
  // output file tracing can't follow — so pdf.worker.mjs was being left out
  // of the serverless bundle entirely and PDF upload died in production with
  // "Cannot find module '/var/task/.../pdf.worker.mjs'". Naming the file here
  // forces it into the deployed output. See lib/parsing/pdf.ts.
  outputFileTracingIncludes: {
    '/api/scripts': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
  },
};

module.exports = nextConfig;
