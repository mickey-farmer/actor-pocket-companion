import type { ScriptFormat } from '../types';
import { parseTxt } from './txt';
import { parsePdf } from './pdf';
import { parseDocx } from './docx';
import { parseFdx } from './fdx';

export function formatFromFilename(filename: string): ScriptFormat | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'txt';
  if (ext === 'docx') return 'docx';
  if (ext === 'fdx') return 'fdx';
  return null;
}

export async function parseByFormat(format: ScriptFormat, buffer: Buffer): Promise<string> {
  switch (format) {
    case 'txt':
      return parseTxt(buffer);
    case 'pdf':
      return parsePdf(buffer);
    case 'docx':
      return parseDocx(buffer);
    case 'fdx':
      return parseFdx(buffer);
  }
}

export { detectScenes } from './sceneDetect';
export { extractLines } from './lineExtract';
