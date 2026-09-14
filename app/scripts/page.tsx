import Link from 'next/link';
import { listScripts } from '@/lib/db';
import AddScriptPanel from '@/components/AddScriptPanel';
import AppHeader from '@/components/AppHeader';
import Icon from '@/components/Icon';
import PageBody from '@/components/PageBody';

export const dynamic = 'force-dynamic';

export default async function ScriptsPage() {
  const scripts = await listScripts();
  const isEmpty = scripts.length === 0;

  return (
    <>
      <AppHeader
        title="Scripts"
        subtitle={
          isEmpty
            ? undefined
            : `${scripts.length} ${scripts.length === 1 ? 'script' : 'scripts'}`
        }
      />
      <PageBody className="space-y-4">
        {isEmpty ? (
          // Real empty state. This used to be a single line of grey text
          // under an upload form, which told a first-time user nothing
          // about what the app is for.
          <div className="rounded-lg border border-stage-border bg-stage-panel px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-stage-accentSoft/15 text-stage-accent">
              <Icon name="scripts" size={22} />
            </div>
            <h2 className="text-base font-semibold text-stage-text">
              Your library is empty
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-stage-muted">
              Add a script and it gets split into scenes automatically. Then pick
              your character to unlock scene analysis, a cheat sheet, and the
              memorization drills.
            </p>
            <div className="mx-auto mt-6 max-w-md text-left">
              <AddScriptPanel startOpen />
            </div>
          </div>
        ) : (
          <>
            {/* Dense rows, not cards. The library is a list you scan, and
                three-line cards meant only a handful fit on a phone. */}
            <ul className="overflow-hidden rounded-lg border border-stage-border bg-stage-panel">
              {scripts.map((s, i) => (
                <li
                  key={s.id}
                  className={i > 0 ? 'border-t border-stage-border' : undefined}
                >
                  <Link
                    href={`/scripts/${s.id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-stage-panel2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-stage-text">
                          {s.title}
                        </span>
                        {s.source_audition_id && (
                          <span className="shrink-0 rounded-full bg-stage-accentSoft/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stage-accent">
                            Audition
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-stage-muted">
                        {s.character ? (
                          <span className="truncate">Playing {s.character}</span>
                        ) : (
                          // An actionable nudge rather than a neutral fact:
                          // nothing else in the app works until it's set.
                          <span className="truncate text-stage-warning">
                            Character not set
                          </span>
                        )}
                        {typeof s.scene_count === 'number' && s.scene_count > 0 && (
                          <>
                            <span aria-hidden="true" className="text-stage-subtle">
                              ·
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {s.scene_count}{' '}
                              {s.scene_count === 1 ? 'scene' : 'scenes'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Icon
                      name="chevronRight"
                      size={16}
                      className="text-stage-subtle transition-colors group-hover:text-stage-accent"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <AddScriptPanel />
          </>
        )}
      </PageBody>
    </>
  );
}
