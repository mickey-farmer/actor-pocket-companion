'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SceneRow, ScriptRow } from '@/lib/types';

export default function MemorizeLauncher() {
  const router = useRouter();
  const [scripts, setScripts] = useState<ScriptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ScriptRow | null>(null);
  const [scenes, setScenes] = useState<SceneRow[]>([]);
  const [loadingScenes, setLoadingScenes] = useState(false);

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((d) => setScripts(d.scripts ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function pickScript(script: ScriptRow) {
    setSelected(script);
    if (!script.character) return;
    setLoadingScenes(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}`);
      const data = await res.json();
      setScenes(data.scenes ?? []);
    } finally {
      setLoadingScenes(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading your scripts…</p>;
  }

  if (scripts.length === 0) {
    return (
      <div className="rounded-lg border border-stage-border bg-stage-panel p-5 text-center text-sm text-slate-400">
        No scripts yet —{' '}
        <Link href="/scripts" className="text-stage-accent underline">
          upload one from the library
        </Link>{' '}
        first.
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-400">Pick a script to drill lines from:</p>
        <ul className="space-y-2">
          {scripts.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => pickScript(s)}
                className="block w-full rounded border border-stage-border bg-stage-panel px-4 py-3 text-left hover:border-stage-accent"
              >
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-slate-400">
                  {s.character ? `Playing ${s.character}` : 'Character not set yet'}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!selected.character) {
    return (
      <div className="space-y-3">
        <BackButton onClick={() => setSelected(null)} />
        <div className="rounded-lg border border-stage-border bg-stage-panel p-5 text-center text-sm text-slate-400">
          You haven&apos;t picked a character for &quot;{selected.title}&quot; yet.{' '}
          <Link href={`/scripts/${selected.id}`} className="text-stage-accent underline">
            Set that first
          </Link>
          , then come back here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BackButton onClick={() => setSelected(null)} />
      <p className="text-sm text-slate-400">
        Pick a scene from &quot;{selected.title}&quot; (playing {selected.character}):
      </p>
      {loadingScenes ? (
        <p className="text-sm text-slate-500">Loading scenes…</p>
      ) : (
        <ul className="space-y-2">
          {scenes.map((scene) => (
            <li key={scene.id}>
              <button
                onClick={() =>
                  router.push(`/scripts/${selected.id}/scenes/${scene.id}?tab=memorize`)
                }
                className="block w-full rounded border border-stage-border bg-stage-panel px-4 py-3 text-left hover:border-stage-accent"
              >
                Scene {scene.scene_index + 1}: {scene.heading}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs text-slate-400 underline hover:text-slate-200">
      ← Choose a different script
    </button>
  );
}
