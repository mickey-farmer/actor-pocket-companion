'use client';

import { useState } from 'react';
import type { AnalysisRow } from '@/lib/types';

export default function AnalysisPanel({
  scriptId,
  sceneId,
  analysis,
  onAnalysis,
}: {
  scriptId: string;
  sceneId: string;
  analysis: AnalysisRow | null;
  onAnalysis: (a: AnalysisRow) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(force: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/scripts/${scriptId}/scenes/${sceneId}/analysis${force ? '?force=true' : ''}`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Could not generate analysis.');
        setLoading(false);
        return;
      }
      onAnalysis(data.analysis);
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-stage-border bg-stage-panel p-5 text-center">
        <p className="mb-3 text-sm text-stage-muted">
          No analysis yet for this scene. This reads the scene once and gives
          you a moment-before, given circumstances, and beat breakdown for
          your character.
        </p>
        <button
          onClick={() => generate(false)}
          disabled={loading}
          className="rounded bg-stage-accent px-4 py-2 font-medium text-stage-onAccent disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Generate analysis'}
        </button>
        {error && <p className="mt-2 text-sm text-stage-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Section title="Story so far">{analysis.story_summary}</Section>
      <Section title="Your character's place in it">{analysis.character_fit}</Section>
      <Section title="The moment before" highlight>
        {analysis.moment_before}
      </Section>
      <Section title="Given circumstances">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Item label="Who" value={analysis.given_circumstances?.who} />
          <Item label="What" value={analysis.given_circumstances?.what} />
          <Item label="Where" value={analysis.given_circumstances?.where} />
          <Item label="When" value={analysis.given_circumstances?.when} />
          <Item label="Why" value={analysis.given_circumstances?.why} />
        </dl>
      </Section>
      <Section title="Beats">
        <ol className="space-y-2">
          {(analysis.beats ?? []).map((b) => (
            <li key={b.beatNumber} className="rounded border border-stage-border p-3">
              <div className="text-xs uppercase text-stage-subtle">Beat {b.beatNumber}</div>
              <div>{b.description}</div>
              <div className="mt-1 text-sm text-stage-muted">
                Shift: {b.intentionShift}
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <div className="flex items-center justify-between">
        {error && <p className="text-sm text-stage-danger">{error}</p>}
        <button
          onClick={() => generate(true)}
          disabled={loading}
          className="ml-auto text-xs text-stage-muted underline hover:text-stage-text disabled:opacity-50"
        >
          {loading ? 'Regenerating…' : 'Regenerate analysis'}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  highlight,
  children,
}: {
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'border-stage-accent/60 bg-stage-accent/5'
          : 'border-stage-border bg-stage-panel'
      }`}
    >
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-stage-muted">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-stage-text">{children}</div>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-stage-subtle">{label}</dt>
      <dd className="text-sm text-stage-text">{value}</dd>
    </div>
  );
}
