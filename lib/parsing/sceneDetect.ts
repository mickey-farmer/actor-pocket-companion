import { extractCharacters, isSceneHeadingLine } from './screenplayHeuristics';

export interface DetectedScene {
  index: number;
  heading: string;
  content: string;
  characters: string[];
}

/**
 * Splits raw script text into scenes. Prefers explicit "## SCENE:" markers
 * (inserted by the .fdx parser), then falls back to common screenplay
 * heading conventions (INT./EXT./ACT/SCENE N), then treats the whole
 * document as a single scene if nothing matches.
 */
export function detectScenes(rawText: string): DetectedScene[] {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n');

  const boundaries: number[] = [];
  lines.forEach((line, i) => {
    if (isSceneHeadingLine(line)) boundaries.push(i);
  });

  let chunks: { heading: string; content: string }[];

  if (boundaries.length > 0) {
    chunks = boundaries.map((start, i) => {
      const end = i + 1 < boundaries.length ? boundaries[i + 1] : lines.length;
      const headingLine = lines[start].trim().replace(/^##\s*SCENE:\s*/i, '');
      const content = lines.slice(start, end).join('\n').trim();
      return { heading: headingLine || `Scene ${i + 1}`, content };
    });
  } else {
    chunks = [{ heading: 'Full Script', content: text.trim() }];
  }

  return chunks
    .filter((c) => c.content.length > 0)
    .map((c, i) => ({
      index: i,
      heading: c.heading,
      content: c.content,
      characters: extractCharacters(c.content),
    }));
}
