// Heuristics for detecting scene headings and character cue lines across
// loosely-formatted screenplay/stage-play text. These are approximations —
// good enough to get an actor 90% of the way there, not a full screenplay
// parser. See BACKLOG.md for known limitations.

const STOPWORDS = new Set([
  'CUT TO',
  'FADE IN',
  'FADE OUT',
  'FADE TO BLACK',
  'THE END',
  'CONTINUED',
  'CONT\'D',
  'SMASH CUT TO',
  'DISSOLVE TO',
  'MORE',
  'V.O.',
  'O.S.',
  'END OF SCENE',
  'INTERMISSION',
]);

export function isSceneHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^##\s*SCENE:/i.test(t)) return true;
  if (/^(INT|EXT|INT\/EXT|I\/E)[.\s\/-]/i.test(t)) return true;
  if (/^SCENE\s+\d+\b/i.test(t)) return true;
  if (/^ACT\s+(ONE|TWO|THREE|FOUR|FIVE|[IVX]+|\d+)\b/i.test(t)) return true;
  return false;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Returns the character name if `line` looks like a dialogue cue
 * (e.g. "JANE", "JANE (CONT'D)", or "Jane:" in stage-play style), else null.
 */
export function characterCueName(line: string): string | null {
  const t = line.trim();
  if (!t || isSceneHeadingLine(t)) return null;

  // Stage-play style: "Name: dialogue" or "NAME: dialogue"
  const colonMatch = t.match(/^([A-Za-z][A-Za-z'.\- ]{0,30}):\s*(.+)$/);
  if (colonMatch) {
    const candidate = colonMatch[1].trim();
    const upper = normalizeName(candidate);
    if (!STOPWORDS.has(upper) && candidate.length <= 30) {
      return upper;
    }
  }

  // Screenplay style: an (mostly) uppercase line, optionally with a
  // parenthetical like "(CONT'D)", and nothing else on the line.
  const cueMatch = t.match(/^([A-Z][A-Z0-9'.\- ]{0,38}?)(\s*\([^)]*\))?$/);
  if (cueMatch) {
    const name = cueMatch[1].trim();
    const letterCount = (name.match(/[A-Z]/g) || []).length;
    if (letterCount >= 2 && name.length <= 40 && !STOPWORDS.has(normalizeName(name))) {
      return normalizeName(name);
    }
  }

  return null;
}

export function extractCharacters(text: string): string[] {
  const names = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const name = characterCueName(line);
    if (name) names.add(name);
  }
  return Array.from(names).sort();
}
