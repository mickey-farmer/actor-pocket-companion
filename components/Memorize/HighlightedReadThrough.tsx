'use client';

import type { ScriptLine } from '@/lib/types';
import { useTextToSpeech } from '@/lib/useTextToSpeech';
import SpeakButton from '@/components/SpeakButton';

export default function HighlightedReadThrough({ lines }: { lines: ScriptLine[] }) {
  const { isSupported, speakingId, speak, stop } = useTextToSpeech();

  return (
    <div className="space-y-2 rounded-lg border border-stage-border bg-stage-panel p-4">
      <p className="text-xs text-slate-400">
        Your lines are highlighted for read-aloud practice. Tap 🔊 on anyone
        else&apos;s line to hear it spoken.
      </p>
      {lines.map((line, i) => {
        const partnerId = `readthrough-${i}`;
        const isPartnerLine = !line.isCharacterLine && !!line.speaker;
        return (
          <div key={i} className="text-sm">
            {line.speaker && (
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {line.speaker}
              </div>
            )}
            <div className="flex items-start gap-2">
              <p
                className={`flex-1 rounded px-2 py-1 ${
                  line.isCharacterLine
                    ? 'bg-stage-accent/20 text-stage-accent'
                    : line.speaker
                    ? 'text-slate-300'
                    : 'italic text-slate-500'
                }`}
              >
                {line.text}
              </p>
              {isSupported && isPartnerLine && (
                <SpeakButton
                  isSpeaking={speakingId === partnerId}
                  onClick={() =>
                    speakingId === partnerId ? stop() : speak(line.text, partnerId)
                  }
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
