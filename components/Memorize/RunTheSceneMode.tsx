'use client';

// Hands-free rehearsal: your scene partner's lines are read aloud via
// text-to-speech, and playback pauses on your own lines just long enough to
// say them before auto-advancing — like running the scene with a partner,
// without needing one.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScriptLine } from '@/lib/types';
import { useTextToSpeech } from '@/lib/useTextToSpeech';

const SPEEDS = [
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1 },
  { label: '1.25×', value: 1.25 },
] as const;

function estimatePauseMs(text: string, speed: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const base = Math.max(1800, words * 420);
  return base / speed;
}

export default function RunTheSceneMode({ lines }: { lines: ScriptLine[] }) {
  const { isSupported, speak, stop } = useTextToSpeech();
  const [isPlaying, setIsPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [hideMyLines, setHideMyLines] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const playingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    clearTimer();
    stop();
  }, [clearTimer, stop]);

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= lines.length) {
        playingRef.current = false;
        setIsPlaying(false);
        return i;
      }
      return next;
    });
  }, [lines.length]);

  // Drives one "beat" at a time: speak partner lines aloud (advance when
  // speech finishes), or hold on the actor's own lines for a beat long
  // enough to say them, then move on automatically.
  useEffect(() => {
    if (!isPlaying || index >= lines.length) return;
    const line = lines[index];
    clearTimer();

    if (!line.text.trim()) {
      timerRef.current = setTimeout(() => playingRef.current && advance(), 300);
    } else if (line.isCharacterLine) {
      timerRef.current = setTimeout(
        () => playingRef.current && advance(),
        estimatePauseMs(line.text, speed)
      );
    } else if (line.speaker) {
      speak(line.text, `run-${index}`, {
        rate: speed,
        onEnd: () => playingRef.current && advance(),
      });
    } else {
      // Stage direction / scene heading — brief beat, no speech.
      timerRef.current = setTimeout(() => playingRef.current && advance(), 900 / speed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, index, speed]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [index]);

  // Stop everything if you leave this drill mode mid-scene.
  useEffect(() => {
    return () => {
      playingRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  function play() {
    if (index >= lines.length) setIndex(0);
    playingRef.current = true;
    setIsPlaying(true);
  }

  function restart() {
    pause();
    setIndex(0);
  }

  if (lines.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-stage-border bg-stage-panel p-4">
      <p className="text-xs text-slate-400">
        Your scene partner&apos;s lines are read aloud, and it pauses on yours
        so you can say them before it moves on — hands-free rehearsal.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {!isPlaying ? (
          <button
            onClick={play}
            className="rounded bg-stage-accent px-4 py-2 text-sm font-medium text-stage-onAccent"
          >
            ▶ {index === 0 ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button
            onClick={pause}
            className="rounded border border-stage-border px-4 py-2 text-sm"
          >
            ⏸ Pause
          </button>
        )}
        <button
          onClick={restart}
          className="rounded border border-stage-border px-3 py-2 text-sm text-slate-400"
        >
          ↺ Restart
        </button>

        <div className="ml-auto flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSpeed(s.value)}
              className={`rounded px-2 py-1 text-xs ${
                speed === s.value
                  ? 'bg-stage-accent text-stage-onAccent'
                  : 'border border-stage-border text-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={hideMyLines}
          onChange={(e) => setHideMyLines(e.target.checked)}
        />
        Hide my lines while running
      </label>

      {!isSupported && (
        <p className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          This browser doesn&apos;t support text-to-speech, so partner lines
          won&apos;t be read aloud — but the auto-advance timing still works.
        </p>
      )}

      <div className="max-h-[50vh] space-y-2 overflow-y-auto rounded border border-stage-border bg-black/20 p-3">
        {lines.map((line, i) => {
          const isActive = i === index;
          return (
            <div
              key={i}
              ref={isActive ? activeRef : undefined}
              className={`rounded px-2 py-1.5 text-sm transition-colors ${
                isActive ? 'bg-stage-accent/20 ring-1 ring-stage-accent' : ''
              }`}
            >
              {line.speaker && (
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {line.speaker}
                </div>
              )}
              <p
                className={
                  line.isCharacterLine
                    ? 'text-stage-accent'
                    : line.speaker
                    ? 'text-slate-300'
                    : 'italic text-slate-500'
                }
              >
                {line.isCharacterLine && hideMyLines ? '· · ·' : line.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
