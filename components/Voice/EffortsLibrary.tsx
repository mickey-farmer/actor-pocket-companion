'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { EFFORT_CATEGORIES, VOCAL_SAFETY_NOTES, type EffortCategory } from '@/lib/voice/efforts';

const LOAD_ORDER: Record<EffortCategory['load'], number> = { light: 0, moderate: 1, heavy: 2 };
const LOAD_STYLES: Record<EffortCategory['load'], string> = {
  light: 'bg-stage-success/15 text-stage-success',
  moderate: 'bg-stage-warning/15 text-stage-warning',
  heavy: 'bg-stage-danger/15 text-stage-danger',
};

interface DrillItem {
  category: EffortCategory;
  prompt: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a drill the way a real efforts session is ordered: lighter
 * categories first, heaviest (attacks, pain, deaths) last, shuffled within
 * each load level so it isn't the same every time.
 */
function buildDrill(categories: EffortCategory[], length: number): DrillItem[] {
  const pool = shuffle(
    categories.flatMap((category) => category.prompts.map((prompt) => ({ category, prompt })))
  ).slice(0, length);
  return pool.sort((a, b) => LOAD_ORDER[a.category.load] - LOAD_ORDER[b.category.load]);
}

export default function EffortsLibrary() {
  const [selected, setSelected] = useState<string[]>(['breaths', 'reactions', 'exertion']);
  const [length, setLength] = useState(10);
  const [drill, setDrill] = useState<DrillItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const selectedCategories = useMemo(
    () => EFFORT_CATEGORIES.filter((c) => selected.includes(c.id)),
    [selected]
  );
  const includesHeavy = selectedCategories.some((c) => c.load === 'heavy');

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function startDrill() {
    setDrill(buildDrill(selectedCategories, length));
    setIndex(0);
  }

  const current = drill?.[index];
  const finished = drill && index >= drill.length;

  return (
    <div className="space-y-6">
      {/* Drill */}
      <section className="rounded-lg border border-stage-border bg-stage-panel p-4">
        {!drill ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-stage-text">Efforts drill</h2>
              <p className="text-xs text-stage-muted">
                Pick categories and get a randomized list, ordered light to heavy like a real session.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {EFFORT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={selected.includes(c.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    selected.includes(c.id)
                      ? 'border-stage-accent bg-stage-accent/15 text-stage-accent'
                      : 'border-stage-border text-stage-muted hover:text-stage-text'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-stage-muted">
                Length
                <select
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="rounded border border-stage-border bg-stage-panel2 px-2 py-1 text-stage-text"
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} prompts
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={startDrill}
                disabled={selectedCategories.length === 0}
                className="rounded-md bg-stage-accent px-4 py-2 text-sm font-semibold text-stage-onAccent hover:bg-stage-accentHover disabled:opacity-50"
              >
                Start drill
              </button>
            </div>
            {includesHeavy && (
              <p className="rounded border border-stage-warning/40 bg-stage-warning/10 px-3 py-2 text-xs text-stage-text">
                This drill includes heavy efforts. Warm up first, keep reps limited, and stop if
                anything scratches or hurts.{' '}
                <Link href="/voice/health" className="text-stage-accent hover:underline">
                  Warm-up routine →
                </Link>
              </p>
            )}
          </div>
        ) : finished ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-base font-semibold text-stage-text">Drill done — nice work.</p>
            <p className="text-sm text-stage-muted">
              Take a sip of water and a minute of easy humming to cool down.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/voice/health#log"
                className="rounded-md bg-stage-accent px-4 py-2 text-sm font-semibold text-stage-onAccent hover:bg-stage-accentHover"
              >
                Log this session
              </Link>
              <button
                type="button"
                onClick={() => setDrill(null)}
                className="rounded-md border border-stage-border px-4 py-2 text-sm text-stage-muted hover:text-stage-text"
              >
                New drill
              </button>
            </div>
          </div>
        ) : (
          current && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stage-muted">
                <span>
                  {index + 1} / {drill.length}
                </span>
                <span className={`rounded-full px-2 py-0.5 ${LOAD_STYLES[current.category.load]}`}>
                  {current.category.name}
                </span>
              </div>
              <p className="py-4 text-center text-xl font-semibold leading-snug text-stage-text">
                {current.prompt}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  className="rounded-md border border-stage-border px-4 py-2 text-sm text-stage-muted hover:text-stage-text disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  className="rounded-md bg-stage-accent px-5 py-2 text-sm font-semibold text-stage-onAccent hover:bg-stage-accentHover"
                >
                  {index + 1 === drill.length ? 'Finish' : 'Next'}
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                <Link
                  href={`/voice/booth?line=${encodeURIComponent(current.prompt)}&context=${encodeURIComponent(
                    `Effort: ${current.category.name}`
                  )}`}
                  className="text-stage-accent hover:underline"
                >
                  Record this in the Booth
                </Link>
                <button
                  type="button"
                  onClick={() => setDrill(null)}
                  className="text-stage-subtle hover:text-stage-text"
                >
                  End drill
                </button>
              </div>
            </div>
          )
        )}
      </section>

      {/* Safety */}
      <section className="rounded-lg border border-stage-border bg-stage-panel p-4">
        <h2 className="text-sm font-semibold text-stage-text">Protect the instrument</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stage-muted">
          {VOCAL_SAFETY_NOTES.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      {/* Library */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-stage-text">Library</h2>
        <ul className="overflow-hidden rounded-lg border border-stage-border bg-stage-panel">
          {EFFORT_CATEGORIES.map((c, i) => {
            const open = openCategory === c.id;
            return (
              <li key={c.id} className={i > 0 ? 'border-t border-stage-border' : undefined}>
                <button
                  type="button"
                  onClick={() => setOpenCategory(open ? null : c.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stage-panel2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stage-text">{c.name}</span>
                    <span className="block text-xs text-stage-muted">{c.summary}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${LOAD_STYLES[c.load]}`}>
                    {c.load}
                  </span>
                </button>
                {open && (
                  <div className="space-y-3 px-4 pb-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-stage-subtle">
                        Technique
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-stage-muted">
                        {c.technique.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-stage-subtle">
                        Practice prompts
                      </p>
                      <ul className="mt-1 space-y-1">
                        {c.prompts.map((p) => (
                          <li key={p} className="flex items-center gap-2 text-sm text-stage-text">
                            <span className="min-w-0 flex-1">{p}</span>
                            <Link
                              href={`/voice/booth?line=${encodeURIComponent(p)}&context=${encodeURIComponent(
                                `Effort: ${c.name}`
                              )}`}
                              className="shrink-0 text-xs text-stage-accent hover:underline"
                            >
                              Record
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
