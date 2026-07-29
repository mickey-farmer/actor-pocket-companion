'use client';

import { useEffect, useRef, useState } from 'react';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function NotesPanel({
  scriptId,
  sceneId,
  initialNotes,
}: {
  scriptId: string;
  sceneId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(initialNotes);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleChange(value: string) {
    setNotes(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => save(value), 800);
  }

  async function save(value: string) {
    if (value === lastSavedRef.current) return;
    setSaveState('saving');
    try {
      const res = await fetch(`/api/scripts/${scriptId}/scenes/${sceneId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value }),
      });
      if (!res.ok) throw new Error('save failed');
      lastSavedRef.current = value;
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  function handleBlur() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    save(notes);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Just for you — director notes, adjustments to try, substitutions.
          Not shared with the AI.
        </p>
        <SaveIndicator state={saveState} />
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        rows={10}
        placeholder="e.g. Director said play it faster. Try substituting my own audition nerves for the character's anxiety in beat 2."
        className="w-full rounded border border-stage-border bg-black/20 px-3 py-2 text-slate-100 outline-none focus:border-stage-accent"
      />
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  if (state === 'saving') return <span className="text-xs text-slate-500">Saving…</span>;
  if (state === 'error') return <span className="text-xs text-red-400">Couldn&apos;t save</span>;
  return <span className="text-xs text-stage-accent2">Saved</span>;
}
