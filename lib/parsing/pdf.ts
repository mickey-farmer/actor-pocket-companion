// pdf-parse bundles a 2018-era build of PDF.js that fails to read many
// perfectly valid modern PDFs (anything saved by Word, Google Docs, Preview,
// Final Draft, Adobe, etc. can trip "bad XRef entry" or come back with zero
// text). pdfjs-dist is the actively maintained upstream library, so we drive
// it directly instead. It's ESM-only, hence the dynamic import.
export async function parsePdf(buffer: Buffer): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const doc = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    verbosity: 0,
  }).promise;

  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    text += pageText + '\n';
    await page.cleanup();
  }
  return text;
}
