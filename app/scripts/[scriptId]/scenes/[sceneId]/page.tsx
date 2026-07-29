import { notFound, redirect } from 'next/navigation';
import { getAnalysis, getScene, getScript, listScenes } from '@/lib/db';
import { extractLines } from '@/lib/parsing';
import SceneWorkspace from '@/components/SceneWorkspace';

export const dynamic = 'force-dynamic';

const VALID_TABS = ['analysis', 'cheatsheet', 'chat', 'memorize', 'notes'] as const;
type TabId = (typeof VALID_TABS)[number];

export default async function ScenePage({
  params,
  searchParams,
}: {
  params: Promise<{ scriptId: string; sceneId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { scriptId, sceneId } = await params;
  const { tab } = await searchParams;
  const script = await getScript(scriptId);
  const scene = await getScene(sceneId);

  if (!script || !scene || scene.script_id !== script.id) notFound();
  if (!script.character) redirect(`/scripts/${script.id}`);

  const allScenes = await listScenes(script.id);
  const analysis = await getAnalysis(scene.id);
  const lines = extractLines(scene.content, script.character);

  const initialTab: TabId = (VALID_TABS as readonly string[]).includes(tab ?? '')
    ? (tab as TabId)
    : 'analysis';

  return (
    <SceneWorkspace
      scriptId={script.id}
      scriptTitle={script.title}
      character={script.character}
      scene={{
        id: scene.id,
        heading: scene.heading,
        content: scene.content,
        sceneIndex: scene.scene_index,
        notes: scene.notes,
      }}
      initialAnalysis={analysis}
      initialTab={initialTab}
      lines={lines}
      sceneNav={allScenes.map((s) => ({
        id: s.id,
        heading: s.heading,
        sceneIndex: s.scene_index,
      }))}
    />
  );
}
