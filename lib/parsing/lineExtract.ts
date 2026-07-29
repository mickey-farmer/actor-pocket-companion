import { characterCueName, isSceneHeadingLine } from './screenplayHeuristics';
import type { ScriptLine } from '../types';

function normalize(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Breaks a single scene's text into an ordered list of turns: dialogue
 * blocks attributed to a speaker, and action/stage-direction blocks
 * (speaker === null). A blank line or a new cue/heading ends the current
 * block — this is a heuristic, not a full screenplay parser (see
 * BACKLOG.md), but works well for consistently-formatted scripts.
 */
export function extractLines(sceneContent: string, character?: string | null): ScriptLine[] {
  const normalizedCharacter = character ? normalize(character) : null;
  const lines = sceneContent.split(/\r?\n/);

  const result: ScriptLine[] = [];
  let currentSpeaker: string | null = null;
  let buffer: string[] = [];

  function flush() {
    const text = buffer.join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];
    if (!text) return;
    result.push({
      speaker: currentSpeaker,
      text,
      isCharacterLine: !!normalizedCharacter && currentSpeaker === normalizedCharacter,
    });
  }

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flush();
      currentSpeaker = null;
      continue;
    }
    if (isSceneHeadingLine(line)) {
      flush();
      currentSpeaker = null;
      continue;
    }
    const cue = characterCueName(line);
    if (cue) {
      flush();
      currentSpeaker = cue;
      continue;
    }
    buffer.push(line);
  }
  flush();

  return result;
}
