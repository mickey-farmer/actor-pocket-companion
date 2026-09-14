import { ensurePdfGlobals } from './pdfGlobals';

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

  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

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
