'use client';

import { useState } from 'react';
import type { ScriptLine } from '@/lib/types';
import LineCoverMode from './LineCoverMode';
import CueCardDrill from './CueCardDrill';
import SelfQuiz from './SelfQuiz';
import HighlightedReadThrough from './HighlightedReadThrough';
import RunTheSceneMode from './RunTheSceneMode';

type Mode = 'cover' | 'cuecard' | 'quiz' | 'readthrough' | 'run';

export default function MemorizeTabs({
  lines,
  character,
}: {
  lines: ScriptLine[];
  character: string;
}) {
  const [mode, setMode] = useState<Mode>('cover');

  const hasCharacterLines = lines.some((l) => l.isCharacterLine);

  const modes: { id: Mode; label: string }[] = [
    { id: 'cover', label: 'Line Cover' },
    { id: 'cuecard', label: 'Cue Cards' },
    { id: 'quiz', label: 'Self-Quiz' },
    { id: 'readthrough', label: 'Read-Through' },
    { id: 'run', label: 'Run the Scene' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded px-3 py-2 text-sm ${
              mode === m.id
                ? 'bg-stage-accent text-stage-onAccent'
                : 'border border-stage-border text-slate-400 hover:border-stage-accent'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!hasCharacterLines ? (
        <div className="rounded-lg border border-stage-border bg-stage-panel p-5 text-center text-sm text-slate-400">
          We didn&apos;t find any lines for &quot;{character}&quot; in this scene.
          Scene/line detection is heuristic — if this looks wrong, double-check
          the character name matches exactly what&apos;s in the script.
        </div>
      ) : (
        <>
          {mode === 'cover' && <LineCoverMode lines={lines} />}
          {mode === 'cuecard' && <CueCardDrill lines={lines} />}
          {mode === 'quiz' && <SelfQuiz lines={lines} />}
          {mode === 'readthrough' && <HighlightedReadThrough lines={lines} />}
          {mode === 'run' && <RunTheSceneMode lines={lines} />}
        </>
      )}
    </div>
  );
}
