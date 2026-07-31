'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuditionRow, SceneRow, ScriptRow } from '@/lib/types';
import { formatAuditionDate } from '@/lib/dateInput';

const MAX_SIDEBAR_AUDITIONS = 4;

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [scripts, setScripts] = useState<ScriptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualExpanded, setManualExpanded] = useState<Record<string, boolean>>({});
  const [scenesByScript, setScenesByScript] = useState<Record<string, SceneRow[]>>({});
  const [loadingScenes, setLoadingScenes] = useState<Record<string, boolean>>({});
  const [auditions, setAuditions] = useState<AuditionRow[]>([]);
  const [loadingAuditions, setLoadingAuditions] = useState(true);

  // Refetch the script list on every navigation so newly-uploaded scripts
  // (or a just-picked character) show up without a full page reload.
  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((d) => setScripts(d.scripts ?? []))
      .finally(() => setLoading(false));
  }, [pathname]);

  // Same idea for auditions, so a newly-added one shows up right away.
  useEffect(() => {
    fetch('/api/auditions')
      .then((r) => r.json())
      .then((d) => setAuditions(d.auditions ?? []))
      .finally(() => setLoadingAuditions(false));
  }, [pathname]);

  const upcomingAuditions = useMemo(
    () =>
      auditions
        .filter((a) => a.status !== 'passed')
        .slice(0, MAX_SIDEBAR_AUDITIONS),
    [auditions]
  );

  const activeScriptId = useMemo(() => {
    const m = pathname.match(/^\/scripts\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  async function loadScenes(scriptId: string) {
    setLoadingScenes((s) => ({ ...s, [scriptId]: true }));
    try {
      const res = await fetch(`/api/scripts/${scriptId}`);
      const data = await res.json();
      setScenesByScript((s) => ({ ...s, [scriptId]: data.scenes ?? [] }));
    } finally {
      setLoadingScenes((s) => ({ ...s, [scriptId]: false }));
    }
  }

  // Automatically reveal the scenes of whichever script you're currently
  // inside, even though everything else stays collapsed.
  useEffect(() => {
    if (activeScriptId && !scenesByScript[activeScriptId] && !loadingScenes[activeScriptId]) {
      loadScenes(activeScriptId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScriptId]);

  function isExpanded(scriptId: string): boolean {
    if (manualExpanded[scriptId] !== undefined) return manualExpanded[scriptId];
    return scriptId === activeScriptId;
  }

  function toggle(scriptId: string) {
    const next = !isExpanded(scriptId);
    setManualExpanded((m) => ({ ...m, [scriptId]: next }));
    if (next && !scenesByScript[scriptId]) loadScenes(scriptId);
  }

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      <Link
        href="/challenge"
        onClick={onNavigate}
        className={`mb-3 flex items-center gap-2 rounded px-2 py-2 text-sm font-medium ${
          pathname === '/challenge'
            ? 'bg-stage-accent/20 text-stage-accent'
            : 'text-slate-300 hover:bg-stage-bg/60'
        }`}
      >
        <span aria-hidden="true">{'\u{1F525}'}</span>
        Today&apos;s Challenge
      </Link>

      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Scripts
        </span>
        <Link
          href="/scripts"
          onClick={onNavigate}
          className="text-xs text-stage-accent hover:underline"
        >
          + Add
        </Link>
      </div>

      {loading && <p className="px-2 py-1 text-xs text-slate-500">Loading…</p>}
      {!loading && scripts.length === 0 && (
        <p className="px-2 py-1 text-xs text-slate-500">No scripts yet.</p>
      )}

      <ul className="space-y-0.5">
        {scripts.map((s) => {
          const expanded = isExpanded(s.id);
          const scriptActive = pathname === `/scripts/${s.id}`;
          return (
            <li key={s.id}>
              <div
                className={`flex items-center gap-1 rounded px-1 py-1.5 ${
                  scriptActive ? 'bg-stage-bg text-stage-accent' : 'hover:bg-stage-bg/60'
                }`}
              >
                <button
                  onClick={() => toggle(s.id)}
                  aria-label={expanded ? 'Collapse scenes' : 'Expand scenes'}
                  className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-400"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
                <Link
                  href={`/scripts/${s.id}`}
                  onClick={onNavigate}
                  className="min-w-0 flex-1 truncate py-1 text-sm"
                >
                  {s.title}
                </Link>
              </div>

              {expanded && (
                <ul className="ml-6 space-y-0.5 border-l border-stage-border pl-2">
                  {loadingScenes[s.id] && (
                    <li className="py-1 text-xs text-slate-500">Loading scenes…</li>
                  )}
                  {!loadingScenes[s.id] && (scenesByScript[s.id] ?? []).length === 0 && (
                    <li className="py-1 text-xs text-slate-500">No scenes found.</li>
                  )}
                  {(scenesByScript[s.id] ?? []).map((scene) => {
                    const href = `/scripts/${s.id}/scenes/${scene.id}`;
                    const active = pathname === href;
                    return (
                      <li key={scene.id}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          className={`block truncate rounded px-2 py-1.5 text-xs ${
                            active
                              ? 'bg-stage-bg text-stage-accent'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {scene.scene_index + 1}. {scene.heading}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t border-stage-border pt-3">
        <div className="mb-1 flex items-center justify-between px-2">
          <Link
            href="/auditions"
            onClick={onNavigate}
            className={`text-xs font-semibold uppercase tracking-wide ${
              pathname === '/auditions' ? 'text-stage-accent' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Auditions
          </Link>
          <Link
            href="/auditions/new"
            onClick={onNavigate}
            className="text-xs text-stage-accent hover:underline"
          >
            + New
          </Link>
        </div>

        {loadingAuditions && <p className="px-2 py-1 text-xs text-slate-500">Loading…</p>}
        {!loadingAuditions && upcomingAuditions.length === 0 && (
          <p className="px-2 py-1 text-xs text-slate-500">Nothing tracked yet.</p>
        )}

        <ul className="space-y-0.5">
          {upcomingAuditions.map((a) => {
            const href = `/auditions/${a.id}`;
            const active = pathname === href;
            return (
              <li key={a.id}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={`block truncate rounded px-2 py-1.5 text-xs ${
                    active ? 'bg-stage-bg text-stage-accent' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="block truncate">{a.project}</span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {formatAuditionDate(a.audition_date)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {auditions.length > MAX_SIDEBAR_AUDITIONS && (
          <Link
            href="/auditions"
            onClick={onNavigate}
            className="mt-1 block px-2 py-1 text-xs text-stage-accent hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      <div className="mt-4 border-t border-stage-border pt-3">
        <Link
          href="/memorize"
          onClick={onNavigate}
          className={`block rounded px-2 py-2 text-sm font-medium ${
            pathname === '/memorize'
              ? 'bg-stage-bg text-stage-accent'
              : 'text-slate-300 hover:bg-stage-bg/60'
          }`}
        >
          Memorize
        </Link>
      </div>
    </nav>
  );
}
