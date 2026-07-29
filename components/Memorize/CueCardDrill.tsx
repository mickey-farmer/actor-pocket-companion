'use client';

import { useMemo, useState } from 'react';
import type { ScriptLine } from '@/lib/types';
import { useTextToSpeech } from '@/lib/useTextToSpeech';
import SpeakButton from '@/components/SpeakButton';

interface DrillItem {
  cue: string | null;
  yourLine: string;
}

function buildDrillItems(lines: ScriptLine[]): DrillItem[] {
  const items: DrillItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].isCharacterLine) {
      items.push({ cue: i > 0 ? lines[i - 1].text : null, yourLine: lines[i].text });
    }
  }
  return items;
}

export default function CueCardDrill({ lines }: { lines: ScriptLine[] }) {
  const items = useMemo(() => buildDrillItems(lines), [lines]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const { isSupported, speakingId, speak, stop } = useTextToSpeech();

  if (items.length === 0) return null;
  const item = items[index];
  const cueId = `cue-${index}`;

  return (
    <div className="space-y-3 rounded-lg border border-stage-border bg-stage-panel p-5">
      <p className="text-xs text-slate-400">
        Card {index + 1} of {items.length}
      </p>
      {item.cue && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-xs uppercase text-slate-500">Cue</div>
            {isSupported && (
              <SpeakButton
                isSpeaking={speakingId === cueId}
                onClick={() => (speakingId === cueId ? stop() : speak(item.cue!, cueId))}
                label="Hear cue"
              />
            )}
          </div>
          <p className="text-slate-300">{item.cue}</p>
        </div>
      )}
      <div>
        <div className="text-xs uppercase text-slate-500">Your line</div>
        {revealed ? (
          <p className="text-stage-accent">{item.yourLine}</p>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="w-full rounded bg-black/30 px-3 py-2 text-left text-slate-500"
          >
            Tap to reveal
          </button>
        )}
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => {
            stop();
            setIndex((i) => Math.max(0, i - 1));
            setRevealed(false);
          }}
          disabled={index === 0}
          className="rounded border border-stage-border px-4 py-2.5 text-sm disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            stop();
            setIndex((i) => Math.min(items.length - 1, i + 1));
            setRevealed(false);
          }}
          disabled={index === items.length - 1}
          className="rounded bg-stage-accent px-4 py-2.5 text-sm font-medium text-stage-onAccent disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
