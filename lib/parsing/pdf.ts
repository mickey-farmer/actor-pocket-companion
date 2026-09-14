import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { ensurePdfGlobals } from './pdfGlobals';

const WORKER_SUBPATH = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

/**
 * Locates pdf.worker.mjs on disk and hands pdfjs an absolute file:// URL for
 * it.
 *
 * In Node, pdfjs has no real Worker, so it falls back to a "fake worker":
 * it dynamically imports the worker module and runs it in-process. Left to
 * its own devices it derives that path relative to pdf.mjs, and the import
 * is computed rather than literal — which means Next.js's output file
 * tracing can't see it, so the worker file is never copied into the
 * serverless bundle. On Vercel that surfaces as:
 *
 *   Setting up fake worker failed: "Cannot find module
 *   '/var/task/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'"
 *
 * Resolving it explicitly fixes the *path*; `outputFileTracingIncludes` in
 * next.config.js is what actually gets the file deployed. Both are required
 * — neither alone is sufficient.
 */
function resolveWorkerSrc(): string | null {
  // Try the project root first (where node_modules lives at runtime), then
  // this module's own location, which covers layouts where the app is
  // nested or symlinked. __filename only exists when this compiles to CJS,
  // and referencing it bare in an ESM build would throw a ReferenceError
  // here rather than inside the try below — hence the typeof guard.
  const bases = [
    `${process.cwd()}/`,
    typeof __filename !== 'undefined' ? __filename : null,
  ].filter((b): b is string => b !== null);

  for (const base of bases) {
    try {
      return pathToFileURL(createRequire(base).resolve(WORKER_SUBPATH)).href;
    } catch {
      // Try the next base.
    }
  }
  return null;
}

// pdf-parse bundles a 2018-era build of PDF.js that fails to read many
// perfectly valid modern PDFs (anything saved by Word, Google Docs, Preview,
// Final Draft, Adobe, etc. can trip "bad XRef entry" or come back with zero
// text). pdfjs-dist is the actively maintained upstream library, so we drive
// it directly instead. It's ESM-only, hence the dynamic import.
export async function parsePdf(buffer: Buffer): Promise<string> {
  // Must run *before* the import below: pdfjs evaluates `new DOMMatrix()` at
  // module scope, so the browser graphics globals have to already exist or
  // the import itself throws "DOMMatrix is not defined". See pdfGlobals.ts.
  await ensurePdfGlobals();

  const { getDocument, GlobalWorkerOptions } = await import(
    'pdfjs-dist/legacy/build/pdf.mjs'
  );

  // Must be set before getDocument(). See resolveWorkerSrc() above.
  if (!GlobalWorkerOptions.workerSrc) {
    const workerSrc = resolveWorkerSrc();
    if (workerSrc) GlobalWorkerOptions.workerSrc = workerSrc;
  }

  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    verbosity: 0,
    // Nothing here renders — we only pull text — so skip the font-face
    // machinery the display path would otherwise set up.
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;

  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();

      // pdfjs emits each text run as its own item and flags the ones that
      // end a visual line. The previous version joined every item with a
      // space, which collapsed each page into one enormous line — and
      // detectScenes()/isSceneHeadingLine() work line by line, so PDFs
      // almost always came back as a single "Full Script" scene. Honouring
      // hasEOL restores the line structure. Runs are concatenated with no
      // separator because pdfjs already emits the inter-word spacing as its
      // own items; adding one here double-spaces the text.
      let pageText = '';
      for (const item of content.items) {
        if (!('str' in item)) continue;
        pageText += item.str;
        if (item.hasEOL) pageText += '\n';
      }

      pages.push(pageText);
      await page.cleanup();
    }
    return pages.join('\n');
  } finally {
    // Releases the worker/port pdfjs allocates per document. Note destroy()
    // lives on the loading task, not on the document proxy.
    await loadingTask.destroy();
  }
}
