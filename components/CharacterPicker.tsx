'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CharacterPicker({
  scriptId,
  detectedCharacters,
}: {
  scriptId: string;
  detectedCharacters: string[];
}) {
  const router = useRouter();
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(character: string) {
    if (!character.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scripts/${scriptId}/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: character.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Could not save your character.');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-stage-border bg-stage-panel p-5">
      <h2 className="text-lg font-medium text-stage-accent">
        What is your character?
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Pick from what we found in the script, or type your character&apos;s name if
        we missed it.
      </p>

      {detectedCharacters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {detectedCharacters.map((name) => (
            <button
              key={name}
              disabled={loading}
              onClick={() => choose(name)}
              className="rounded-full border border-stage-border px-4 py-2 text-sm hover:border-stage-accent hover:text-stage-accent disabled:opacity-50"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Type a character name"
          className="flex-1 rounded border border-stage-border bg-black/20 px-3 py-2 text-slate-100 outline-none focus:border-stage-accent"
        />
        <button
          disabled={loading || !custom.trim()}
          onClick={() => choose(custom)}
          className="rounded bg-stage-accent px-4 py-2 font-medium text-stage-onAccent disabled:opacity-50"
        >
          Use this
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
