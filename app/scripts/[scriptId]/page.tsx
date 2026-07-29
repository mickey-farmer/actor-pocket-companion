import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getScript, listScenes } from '@/lib/db';
import CharacterPicker from '@/components/CharacterPicker';
import AppHeader from '@/components/AppHeader';

export const dynamic = 'force-dynamic';

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ scriptId: string }>;
}) {
  const { scriptId } = await params;
  const script = await getScript(scriptId);
  if (!script) notFound();

  const scenes = await listScenes(script.id);

  if (!script.character) {
    const detected = Array.from(new Set(scenes.flatMap((s) => s.characters))).sort();
    return (
      <>
        <AppHeader title={script.title} backHref="/scripts" backLabel="All scripts" />
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          <CharacterPicker scriptId={script.id} detectedCharacters={detected} />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={script.title}
        subtitle={`Playing: ${script.character}`}
        backHref="/scripts"
        backLabel="All scripts"
      />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <div>
          <h2 className="mb-2 text-sm uppercase tracking-wide text-slate-400">
            Scenes
          </h2>
          <ul className="space-y-2">
            {scenes.map((scene) => (
              <li key={scene.id}>
                <Link
                  href={`/scripts/${script.id}/scenes/${scene.id}`}
                  className="block rounded border border-stage-border bg-stage-panel px-4 py-3 hover:border-stage-accent"
                >
                  <div className="font-medium">
                    Scene {scene.scene_index + 1}: {scene.heading}
                  </div>
                  {scene.characters.length > 0 && (
                    <div className="text-xs text-slate-400">
                      {scene.characters.join(', ')}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
