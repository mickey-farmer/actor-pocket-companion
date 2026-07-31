'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DailyChallengeRow } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  vocal: 'Vocal',
  physical: 'Physical',
  'emotional-recall': 'Emotional Recall',
  improv: 'Improv',
  'cold-read': 'Cold Read',
  observation: 'Observation',
  imagination: 'Imagination',
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

interface ChallengeState {
  challenge: DailyChallengeRow | null;
  streak: number;
  history: DailyChallengeRow[];
}

export default function DailyChallenge() {
  const [state, setState] = useState<ChallengeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/challenge');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not load today’s challenge.');
      setState(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/challenge', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not generate a new challenge.');
      setState(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleComplete() {
    if (!state?.challenge) return;
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/challenge/${state.challenge.id}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not mark this complete.');
      // Re-fetch so the streak/history recompute with the new completion.
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return <p className="px-1 py-4 text-sm text-slate-400">Loading today’s challenge…</p>;
  }

  if (error && !state) {
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  const challenge = state?.challenge;
  const isDone = !!challenge?.completed_at;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded border border-stage-border bg-stage-panel px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current streak
          </div>
          <div className="text-2xl font-semibold text-stage-accent">
            {state?.streak ?? 0} {state?.streak === 1 ? 'day' : 'days'}
          </div>
        </div>
        <div className="text-3xl" aria-hidden="true">
          {(state?.streak ?? 0) > 0 ? '\u{1F525}' : '✨'}
        </div>
      </div>

      {challenge && (
        <div className="rounded border border-stage-border bg-stage-panel px-4 py-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-stage-accent/20 px-2 py-1 text-xs font-medium text-stage-accent">
              {categoryLabel(challenge.category)}
            </span>
            {challenge.duration_minutes && (
              <span className="text-xs text-slate-500">~{challenge.duration_minutes} min</span>
            )}
          </div>
          <h2 className="mb-2 text-lg font-semibold text-slate-100">{challenge.title}</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-300">{challenge.prompt_text}</p>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={handleComplete}
              disabled={isDone || completing}
              className={`rounded px-3 py-2 text-sm font-medium ${
                isDone
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-stage-accent text-stage-onAccent disabled:opacity-60'
              }`}
            >
              {isDone ? 'Completed ✓' : completing ? 'Marking done…' : 'Mark as done'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded border border-stage-border px-3 py-2 text-sm text-slate-300 hover:bg-stage-bg disabled:opacity-60"
            >
              {refreshing ? 'Generating…' : 'Give me a different one'}
            </button>
          </div>
        </div>
      )}

      {state && state.history.length > 1 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recent history
          </div>
          <ul className="space-y-1">
            {state.history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-slate-400"
              >
                <span className="truncate">
                  {h.challenge_date} — {h.title}
                </span>
                <span className={h.completed_at ? 'text-emerald-400' : 'text-slate-600'}>
                  {h.completed_at ? '✓' : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
