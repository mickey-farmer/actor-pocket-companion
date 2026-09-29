'use client';

import { useMemo, useState } from 'react';
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
  type GlossaryTerm,
} from '@/lib/glossary';

const CATEGORY_IDS = Object.keys(GLOSSARY_CATEGORIES) as GlossaryCategory[];

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** First alphanumeric character, so "16 bars" files under # and "Résumé" under R. */
function letterFor(term: string): string {
  const ch = normalize(term).replace(/[^a-z0-9]/g, '')[0] ?? '#';
  return /[a-z]/.test(ch) ? ch.toUpperCase() : '#';
}

export default function GlossaryBrowser() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return GLOSSARY.filter((t) => category === 'all' || t.categories.includes(category))
      .filter(
        (t) =>
          !q ||
          normalize(t.term).includes(q) ||
          t.aka?.some((a) => normalize(a).includes(q)) ||
          normalize(t.definition).includes(q)
      )
      .sort((a, b) => {
        // Term-name matches before definition-only matches when searching.
        if (q) {
          const am = normalize(a.term).includes(q) || a.aka?.some((x) => normalize(x).includes(q));
          const bm = normalize(b.term).includes(q) || b.aka?.some((x) => normalize(x).includes(q));
          if (am !== bm) return am ? -1 : 1;
        }
        return normalize(a.term).localeCompare(normalize(b.term));
      });
  }, [query, category]);

  // Group alphabetically only when browsing; search results read better as a flat list.
  const groups = useMemo(() => {
    if (query.trim()) return [{ letter: '', terms: filtered }];
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of filtered) {
      const l = letterFor(t.term);
      map.set(l, [...(map.get(l) ?? []), t]);
    }
    return Array.from(map, ([letter, terms]) => ({ letter, terms }));
  }, [filtered, query]);

  return (
    <div className="space-y-4">
      <div className="no-print sticky top-14 z-10 -mx-4 space-y-3 border-b border-stage-border bg-stage-bg/95 px-4 pb-3 pt-1 backdrop-blur sm:-mx-6 sm:px-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${GLOSSARY.length} terms…`}
          aria-label="Search the glossary"
          className="w-full rounded border border-stage-border bg-stage-panel px-3 py-2 text-sm text-stage-text outline-none focus:border-stage-accent"
        />
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {(['all', ...CATEGORY_IDS] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors ${
                category === c
                  ? 'border-stage-accent bg-stage-accent/15 text-stage-accent'
                  : 'border-stage-border text-stage-muted hover:text-stage-text'
              }`}
            >
              {c === 'all' ? 'All' : GLOSSARY_CATEGORIES[c]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-stage-subtle">
          No terms match. Try the Coach Chat — it can explain anything not listed here.
        </p>
      ) : (
        <p className="text-xs text-stage-subtle">
          {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
        </p>
      )}

      {groups.map(({ letter, terms }) => (
        <section key={letter || 'results'}>
          {letter && (
            <h2 className="mb-1.5 text-xs font-semibold tracking-wider text-stage-accent">{letter}</h2>
          )}
          <dl className="overflow-hidden rounded-lg border border-stage-border bg-stage-panel">
            {terms.map((t, i) => (
              <div key={t.term} className={`px-4 py-3 ${i > 0 ? 'border-t border-stage-border' : ''}`}>
                <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-stage-text">{t.term}</span>
                  {t.aka && t.aka.length > 0 && (
                    <span className="text-xs text-stage-subtle">also: {t.aka.join(', ')}</span>
                  )}
                </dt>
                <dd className="mt-1 text-sm text-stage-muted">{t.definition}</dd>
                <dd className="mt-1.5 flex flex-wrap gap-1">
                  {t.categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-stage-panel2 px-2 py-0.5 text-[10px] text-stage-subtle"
                    >
                      {GLOSSARY_CATEGORIES[c]}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
