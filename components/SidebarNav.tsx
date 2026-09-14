'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuditionRow, SceneRow, ScriptRow } from '@/lib/types';
import { formatAuditionDate } from '@/lib/dateInput';
import Icon from './Icon';
import { NAV_ITEMS, isNavItemActive } from './navItems';

const MAX_SIDEBAR_AUDITIONS = 4;

function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-1 mt-5 flex items-center justify-between gap-2 px-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stage-subtle">
        {children}
      </span>
      {action}
    </div>
  );
}

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
    () => auditions.filter((a) => a.status !== 'passed').slice(0, MAX_SIDEBAR_AUDITIONS),
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
    <nav aria-label="Sidebar" className="flex-1 overflow-y-auto px-2 py-3">
      {/* Primary destinations — same set as the mobile tab bar, from
          navItems.ts, so the two can't drift apart. */}
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded px-2.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-stage-accentSoft/15 text-stage-accent'
                    : 'text-stage-muted hover:bg-stage-panel2 hover:text-stage-text'
                }`}
              >
                <Icon name={item.icon} size={17} strokeWidth={active ? 2 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Script tree — the reason the desktop sidebar earns its width. Lets
          you jump straight to a scene without going back through the list. */}
      <SectionLabel
        action={
          <Link
            href="/scripts"
            onClick={onNavigate}
            aria-label="Add a script"
            className="rounded p-0.5 text-stage-subtle transition-colors hover:text-stage-accent"
          >
            <Icon name="plus" size={15} strokeWidth={2} />
          </Link>
        }
      >
        Library
      </SectionLabel>

      {loading && <p className="px-2.5 py-1 text-xs text-stage-subtle">Loading…</p>}
      {!loading && scripts.length === 0 && (
        <p className="px-2.5 py-1 text-xs text-stage-subtle">No scripts yet.</p>
      )}

      <ul className="space-y-0.5">
        {scripts.map((s) => {
          const expanded = isExpanded(s.id);
          const scriptActive = pathname === `/scripts/${s.id}`;
          const scenes = scenesByScript[s.id] ?? [];
          return (
            <li key={s.id}>
              <div
                className={`flex items-center rounded transition-colors ${
                  scriptActive
                    ? 'bg-stage-accentSoft/15 text-stage-accent'
                    : 'text-stage-muted hover:bg-stage-panel2'
                }`}
              >
                <button
                  onClick={() => toggle(s.id)}
                  aria-label={expanded ? `Collapse ${s.title}` : `Expand ${s.title}`}
                  aria-expanded={expanded}
                  className="flex h-8 w-7 shrink-0 items-center justify-center text-stage-subtle hover:text-stage-text"
                >
                  <Icon
                    name="chevronRight"
                    size={13}
                    strokeWidth={2.5}
                    className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
                  />
                </button>
                <Link
                  href={`/scripts/${s.id}`}
                  onClick={onNavigate}
                  className="min-w-0 flex-1 truncate py-1.5 pr-2 text-sm"
                >
                  {s.title}
                </Link>
              </div>

              {expanded && (
                <ul className="ml-[1.3rem] space-y-px border-l border-stage-border pl-2">
                  {loadingScenes[s.id] && (
                    <li className="py-1 pl-2 text-xs text-stage-subtle">Loading scenes…</li>
                  )}
                  {!loadingScenes[s.id] && scenes.length === 0 && (
                    <li className="py-1 pl-2 text-xs text-stage-subtle">No scenes found.</li>
                  )}
                  {scenes.map((scene) => {
                    const href = `/scripts/${s.id}/scenes/${scene.id}`;
                    const active = pathname === href;
                    return (
                      <li key={scene.id}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          aria-current={active ? 'page' : undefined}
                          className={`block truncate rounded px-2 py-1.5 text-xs transition-colors ${
                            active
                              ? 'bg-stage-accentSoft/15 font-medium text-stage-accent'
                              : 'text-stage-subtle hover:bg-stage-panel2 hover:text-stage-text'
                          }`}
                        >
                          <span className="tabular-nums text-stage-subtle">
                            {scene.scene_index + 1}.
                          </span>{' '}
                          {scene.heading}
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

      <SectionLabel
        action={
          <Link
            href="/auditions/new"
            onClick={onNavigate}
            aria-label="Add an audition"
            className="rounded p-0.5 text-stage-subtle transition-colors hover:text-stage-accent"
          >
            <Icon name="plus" size={15} strokeWidth={2} />
          </Link>
        }
      >
        Upcoming
      </SectionLabel>

      {loadingAuditions && <p className="px-2.5 py-1 text-xs text-stage-subtle">Loading…</p>}
      {!loadingAuditions && upcomingAuditions.length === 0 && (
        <p className="px-2.5 py-1 text-xs text-stage-subtle">Nothing tracked yet.</p>
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
                aria-current={active ? 'page' : undefined}
                className={`block rounded px-2.5 py-1.5 transition-colors ${
                  active
                    ? 'bg-stage-accentSoft/15 text-stage-accent'
                    : 'hover:bg-stage-panel2'
                }`}
              >
                <span className="block truncate text-xs font-medium text-stage-muted">
                  {a.project}
                </span>
                <span className="block truncate text-[11px] text-stage-subtle">
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
          className="mt-1 block px-2.5 py-1 text-xs text-stage-accent hover:underline"
        >
          View all {auditions.length}
        </Link>
      )}
    </nav>
  );
}
