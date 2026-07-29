'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisRow, ScriptLine } from '@/lib/types';
import AppHeader from './AppHeader';
import AnalysisPanel from './AnalysisPanel';
import CheatSheet from './CheatSheet';
import ChatPanel from './ChatPanel';
import NotesPanel from './NotesPanel';
import MemorizeTabs from './Memorize/MemorizeTabs';

type Tab = 'analysis' | 'cheatsheet' | 'chat' | 'memorize' | 'notes';

interface SceneInfo {
  id: string;
  heading: string;
  content: string;
  sceneIndex: number;
  notes: string;
}
interface SceneNavItem {
  id: string;
  heading: string;
  sceneIndex: number;
}

const TABS: { id: Tab; label: string; shortLabel: string }[] = [
  { id: 'analysis', label: 'Analysis', shortLabel: 'Analysis' },
  { id: 'cheatsheet', label: 'Cheat Sheet', shortLabel: 'Cheat' },
  { id: 'chat', label: 'Chat', shortLabel: 'Chat' },
  { id: 'memorize', label: 'Memorize', shortLabel: 'Memorize' },
  { id: 'notes', label: 'Notes', shortLabel: 'Notes' },
];

export default function SceneWorkspace({
  scriptId,
  scriptTitle,
  character,
  scene,
  initialAnalysis,
  initialTab,
  lines,
  sceneNav,
}: {
  scriptId: string;
  scriptTitle: string;
  character: string;
  scene: SceneInfo;
  initialAnalysis: AnalysisRow | null;
  initialTab?: Tab;
  lines: ScriptLine[];
  sceneNav: SceneNavItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab ?? 'analysis');
  const [analysis, setAnalysis] = useState<AnalysisRow | null>(initialAnalysis);

  return (
    <>
      <AppHeader
        title={`Scene ${scene.sceneIndex + 1}: ${scene.heading}`}
        subtitle={`Playing: ${character}`}
        backHref={`/scripts/${scriptId}`}
        backLabel={scriptTitle}
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 pb-24 md:pb-6">
        {sceneNav.length > 1 && (
          <div className="no-print">
            <label htmlFor="scene-select" className="sr-only">
              Jump to scene
            </label>
            <select
              id="scene-select"
              value={scene.id}
              onChange={(e) => router.push(`/scripts/${scriptId}/scenes/${e.target.value}`)}
              className="w-full rounded border border-stage-border bg-stage-panel px-3 py-2 text-stage-text outline-none focus:border-stage-accent"
            >
              {sceneNav.map((s) => (
                <option key={s.id} value={s.id}>
                  Scene {s.sceneIndex + 1}: {s.heading}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Desktop tab strip */}
        <div className="no-print hidden flex-wrap gap-1 border-b border-stage-border md:flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm ${
                tab === t.id
                  ? 'border-b-2 border-stage-accent text-stage-accent'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === 'analysis' && (
            <AnalysisPanel
              scriptId={scriptId}
              sceneId={scene.id}
              analysis={analysis}
              onAnalysis={setAnalysis}
            />
          )}
          {tab === 'cheatsheet' && (
            <CheatSheet
              analysis={analysis}
              sceneHeading={scene.heading}
              character={character}
            />
          )}
          {tab === 'chat' && <ChatPanel scriptId={scriptId} sceneId={scene.id} />}
          {tab === 'memorize' && <MemorizeTabs lines={lines} character={character} />}
          {tab === 'notes' && (
            <NotesPanel scriptId={scriptId} sceneId={scene.id} initialNotes={scene.notes} />
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-20 flex border-t border-stage-border bg-stage-panel md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
              tab === t.id ? 'text-stage-accent' : 'text-slate-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                tab === t.id ? 'bg-stage-accent' : 'bg-transparent'
              }`}
            />
            {t.shortLabel}
          </button>
        ))}
      </nav>
    </>
  );
}
