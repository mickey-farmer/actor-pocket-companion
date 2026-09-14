import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getScript, listScenes } from '@/lib/db';
import AppHeader from '@/components/AppHeader';
import CharacterPicker from '@/components/CharacterPicker';
import Icon from '@/components/Icon';
import PageBody from '@/components/PageBody';

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
        <AppHeader
          title={script.title}
          subtitle="Choose your character to continue"
          backHref="/scripts"
          backLabel="All scripts"
        />
        <PageBody>
          <CharacterPicker scriptId={script.id} detectedCharacters={detected} />
        </PageBody>
      </>
    );
  }

  // Hoisted so it stays narrowed to `string` inside the render callbacks
  // below — TypeScript can't carry the early-return narrowing into a closure
  // over a mutable property.
  const character = script.character;

  return (
    <>
      <AppHeader
        title={script.title}
        subtitle={`Playing ${character} · ${scenes.length} ${
          scenes.length === 1 ? 'scene' : 'scenes'
        }`}
        backHref="/scripts"
        backLabel="All scripts"
      />
      <PageBody>
        {scenes.length === 0 ? (
          <div className="rounded-lg border border-stage-border bg-stage-panel px-6 py-10 text-center">
            <h2 className="text-base font-semibold text-stage-text">
              No scenes detected
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-stage-muted">
              This script didn&apos;t contain any recognizable scene headings
              (INT./EXT., ACT, or SCENE). The full text is still saved.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-stage-border bg-stage-panel">
            {scenes.map((scene, i) => (
              <li
                key={scene.id}
                className={i > 0 ? 'border-t border-stage-border' : undefined}
              >
                <Link
                  href={`/scripts/${script.id}/scenes/${scene.id}`}
                  className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-stage-panel2"
                >
                  <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-medium tabular-nums text-stage-subtle">
                    {scene.scene_index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-stage-text">
                      {scene.heading}
                    </div>
                    {scene.characters.length > 0 && (
                      <div className="mt-0.5 truncate text-xs text-stage-muted">
                        {/* Your own name first — it's the thing you're
                            scanning for when finding your scenes. */}
                        {[
                          ...scene.characters.filter((c) => c === character),
                          ...scene.characters.filter((c) => c !== character),
                        ].join(', ')}
                      </div>
                    )}
                  </div>
                  {scene.characters.includes(character) && (
                    <span className="mt-0.5 shrink-0 rounded-full bg-stage-accentSoft/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stage-accent">
                      You
                    </span>
                  )}
                  <Icon
                    name="chevronRight"
                    size={16}
                    className="mt-0.5 text-stage-subtle transition-colors group-hover:text-stage-accent"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
