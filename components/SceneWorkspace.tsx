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

      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
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

        {/* Scene tabs, on every screen size. These used to be a fixed bar at
            the bottom on mobile, but the app-wide MobileTabBar now owns that
            spot and sat on top of it — hiding Chat and every other tab on
            phones. Sticky under the header instead, and scrollable
            sideways if the labels don't fit. */}
        <div
          role="tablist"
          aria-label="Scene tools"
          className="no-print sticky top-14 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-stage-border bg-stage-bg/95 px-4 backdrop-blur sm:-mx-6 sm:px-6"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 whitespace-nowrap px-3 py-2.5 text-sm ${
                tab === t.id
                  ? 'border-b-2 border-stage-accent font-medium text-stage-accent'
                  : 'text-stage-muted hover:text-stage-text'
              }`}
            >
              <span className="sm:hidden">{t.shortLabel}</span>
              <span className="hidden sm:inline">{t.label}</span>
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
          {tab === 'chat' && (
            <ChatPanel
              endpoint={`/api/scripts/${scriptId}/scenes/${scene.id}/chat`}
              scopeNote={`Scene coach for ${character} in this scene. For the whole script, use “Chat about script” on the script page.`}
              emptyText="Say hello, or ask where to start — your coach will pick up from the moment before."
              placeholder="Talk with your scene coach…"
              suggestions={[
                'Where should I start with this scene?',
                'What do I want from the other person here?',
                'Help me find the moment before.',
              ]}
            />
          )}
          {tab === 'memorize' && <MemorizeTabs lines={lines} character={character} />}
          {tab === 'notes' && (
            <NotesPanel scriptId={scriptId} sceneId={scene.id} initialNotes={scene.notes} />
          )}
        </div>
      </div>

    </>
  );
}
