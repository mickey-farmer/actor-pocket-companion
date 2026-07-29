'use client';

import type { AnalysisRow } from '@/lib/types';

export default function CheatSheet({
  analysis,
  sceneHeading,
  character,
}: {
  analysis: AnalysisRow | null;
  sceneHeading: string;
  character: string;
}) {
  if (!analysis) {
    return (
      <div className="rounded-lg border border-stage-border bg-stage-panel p-5 text-center text-sm text-slate-400">
        Generate the analysis first (see the Analysis tab) — the cheat sheet is
        built from it.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end">
        <button
          onClick={() => window.print()}
          className="rounded border border-stage-border px-4 py-2 text-xs hover:border-stage-accent hover:text-stage-accent"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="rounded-lg border border-stage-border bg-stage-panel p-5 print:border-0 print:bg-white print:text-black">
        <h2 className="text-lg font-semibold text-stage-accent print:text-black">
          {sceneHeading}
        </h2>
        <p className="mb-4 text-sm text-slate-400 print:text-black">
          Playing: {character}
        </p>

        <CheatItem title="Moment Before">{analysis.moment_before}</CheatItem>

        <CheatItem title="Given Circumstances">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Who:</strong> {analysis.given_circumstances?.who}
            </li>
            <li>
              <strong>What:</strong> {analysis.given_circumstances?.what}
            </li>
            <li>
              <strong>Where:</strong> {analysis.given_circumstances?.where}
            </li>
            <li>
              <strong>When:</strong> {analysis.given_circumstances?.when}
            </li>
            <li>
              <strong>Why:</strong> {analysis.given_circumstances?.why}
            </li>
          </ul>
        </CheatItem>

        <CheatItem title="Beats">
          <ol className="list-decimal space-y-1 pl-5">
            {(analysis.beats ?? []).map((b) => (
              <li key={b.beatNumber}>
                {b.description}{' '}
                <span className="text-stage-accent2 print:text-black">
                  (shift: {b.intentionShift})
                </span>
              </li>
            ))}
          </ol>
        </CheatItem>

        <p className="mt-4 text-xs text-slate-500 print:text-black">
          Objective/obstacle and relationship-map sections are coming in a
          later version — for now, use the Chat tab to work those out loud.
        </p>
      </div>
    </div>
  );
}

function CheatItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 print:text-black">
        {title}
      </h3>
      <div className="mt-1 text-sm leading-relaxed print:text-black">{children}</div>
    </div>
  );
}
