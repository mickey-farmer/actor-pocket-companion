// Runs automatically after every `npm install` (see package.json
// "postinstall") to patch a known bug in Next.js's own vendored
// ua-parser-js (node_modules/next/dist/compiled/ua-parser-js/ua-parser.js).
//
// That file references the Node-only `__dirname` global unconditionally
// at module scope, in a line ncc's bundler runtime injects to resolve an
// "asset base" path:
//
//   if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";
//
// `next/server` unconditionally requires this module (via
// server/web/spec-extension/user-agent.js) the moment anything is
// imported from 'next/server' — even if the importing code never calls
// userAgent()/isBot()/userAgentFromString(). Since the Edge runtime has no
// `__dirname`, this throws "ReferenceError: __dirname is not defined" on
// every request that hits Edge middleware (see
// https://github.com/vercel/next.js/issues/53968). It reproduces even
// with next.config.js webpack customizations (resolve.alias,
// config.node.__dirname), which suggests this specific file either isn't
// routed through this project's webpack module graph, or is copied
// verbatim by Vercel's build/file-tracing step — either way, editing the
// file's actual contents on disk is the one fix guaranteed to apply
// regardless of how it's loaded.
//
// This script is idempotent: safe to run multiple times (e.g. across
// repeated `npm install` runs) since it checks for the already-patched
// string before touching the file, and does nothing (without failing the
// build) if the target file is missing or has changed shape in a future
// Next.js version.

const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  __dirname,
  '..',
  'node_modules',
  'next',
  'dist',
  'compiled',
  'ua-parser-js',
  'ua-parser.js'
);

const BEFORE = 'typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/"';
const AFTER =
  'typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=(typeof __dirname!=="undefined"?__dirname:"")+"/"';

function main() {
  if (!fs.existsSync(TARGET)) {
    console.warn(
      '[patch-ua-parser] Target file not found, skipping (Next.js version may have changed):',
      TARGET
    );
    return;
  }

  const content = fs.readFileSync(TARGET, 'utf8');

  if (content.includes(AFTER)) {
    console.log('[patch-ua-parser] Already patched, nothing to do.');
    return;
  }

  if (!content.includes(BEFORE)) {
    console.warn(
      '[patch-ua-parser] Expected code not found, skipping (Next.js internals may have changed).'
    );
    return;
  }

  fs.writeFileSync(TARGET, content.replace(BEFORE, AFTER));
  console.log('[patch-ua-parser] Patched __dirname reference in vendored ua-parser-js.');
}

main();
