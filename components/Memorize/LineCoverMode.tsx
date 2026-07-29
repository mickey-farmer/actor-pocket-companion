'use client';

import { useState } from 'react';
import type { ScriptLine } from '@/lib/types';
import { useTextToSpeech } from '@/lib/useTextToSpeech';
import SpeakButton from '@/components/SpeakButton';

export default function LineCoverMode({ lines }: { lines: ScriptLine[] }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const { isSupported, speakingId, speak, stop } = useTextToSpeech();

  function toggle(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-2 rounded-lg border border-stage-border bg-stage-panel p-4">
      <p className="text-xs text-slate-400">
        Tap your blurred lines to reveal them one at a time as you recite from
        memory. Everyone else&apos;s lines stay visible so you still have your
        cues.
      </p>
      {lines.map((line, i) => (
        <div key={i} className="text-sm">
          {line.speaker && (
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {line.speaker}
            </div>
          )}
          {line.isCharacterLine ? (
            <button
              onClick={() => toggle(i)}
              className={`line-blank block w-full rounded bg-black/30 px-3 py-2.5 text-left ${
                revealed.has(i) ? 'revealed' : ''
              }`}
            >
              {line.text}
            </button>
          ) : line.speaker ? (
            <div className="flex items-start gap-2">
              <p className="flex-1 text-slate-300">{line.text}</p>
              {isSupported && (
                <SpeakButton
                  isSpeaking={speakingId === `cover-${i}`}
                  onClick={() =>
                    speakingId === `cover-${i}` ? stop() : speak(line.text, `cover-${i}`)
                  }
                />
              )}
            </div>
          ) : (
            <p className="italic text-slate-500">{line.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}
