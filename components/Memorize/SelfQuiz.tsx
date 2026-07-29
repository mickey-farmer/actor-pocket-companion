'use client';

import { useMemo, useState } from 'react';
import type { ScriptLine } from '@/lib/types';
import { scoreRecall } from '@/lib/textDiff';
import { useTextToSpeech } from '@/lib/useTextToSpeech';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import SpeakButton from '@/components/SpeakButton';

interface QuizItem {
  cue: string | null;
  yourLine: string;
}

function buildItems(lines: ScriptLine[]): QuizItem[] {
  const items: QuizItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].isCharacterLine) {
      items.push({ cue: i > 0 ? lines[i - 1].text : null, yourLine: lines[i].text });
    }
  }
  return items;
}

export default function SelfQuiz({ lines }: { lines: ScriptLine[] }) {
  const items = useMemo(() => buildItems(lines), [lines]);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState('');
  const [result, setResult] = useState<{ accuracy: number } | null>(null);
  const { isSupported, speakingId, speak, stop } = useTextToSpeech();
  const {
    isSupported: micSupported,
    isListening,
    error: micError,
    listen,
    stop: stopListening,
  } = useSpeechRecognition();

  if (items.length === 0) return null;
  const item = items[index];
  const cueId = `quiz-cue-${index}`;

  function submit() {
    setResult(scoreRecall(item.yourLine, attempt));
  }

  function speakYourAttempt() {
    listen((transcript) => {
      setAttempt(transcript);
      setResult(scoreRecall(item.yourLine, transcript));
    });
  }

  function goTo(i: number) {
    stop();
    stopListening();
    setIndex(i);
    setAttempt('');
    setResult(null);
  }

  return (
    <div className="space-y-3 rounded-lg border border-stage-border bg-stage-panel p-5">
      <p className="text-xs text-slate-400">
        Line {index + 1} of {items.length} — type your line from memory, then
        check.
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
      <textarea
        value={attempt}
        onChange={(e) => setAttempt(e.target.value)}
        rows={3}
        placeholder="Type your line, or tap the mic and say it aloud…"
        className="w-full rounded border border-stage-border bg-black/20 px-3 py-2 text-slate-100 outline-none focus:border-stage-accent"
      />
      {micSupported && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (isListening ? stopListening() : speakYourAttempt())}
            className={`flex items-center gap-1.5 rounded px-3 py-2 text-sm ${
              isListening
                ? 'bg-red-500/20 text-red-400'
                : 'border border-stage-border text-slate-300 hover:border-stage-accent hover:text-stage-accent'
            }`}
          >
            {isListening ? '● Listening…' : '🎤 Say your line'}
          </button>
          {micError && <span className="text-xs text-red-400">{micError}</span>}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={!attempt.trim()}
          className="rounded bg-stage-accent px-4 py-2 text-sm font-medium text-stage-onAccent disabled:opacity-50"
        >
          Check
        </button>
        {result && (
          <span
            className={`text-sm ${
              result.accuracy >= 85
                ? 'text-green-400'
                : result.accuracy >= 60
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          >
            {result.accuracy}% match
          </span>
        )}
      </div>
      {result && (
        <div className="rounded border border-stage-border bg-black/20 p-3 text-sm">
          <div className="text-xs uppercase text-slate-500">Script line</div>
          <p>{item.yourLine}</p>
        </div>
      )}
      <div className="flex justify-between">
        <button
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={index === 0}
          className="rounded border border-stage-border px-4 py-2.5 text-sm disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={() => goTo(Math.min(items.length - 1, index + 1))}
          disabled={index === items.length - 1}
          className="rounded border border-stage-border px-4 py-2.5 text-sm disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
