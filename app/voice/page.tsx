import Link from 'next/link';
import { listVoiceCharacters } from '@/lib/db';
import AppHeader from '@/components/AppHeader';
import Icon from '@/components/Icon';
import PageBody from '@/components/PageBody';
import { MEDIUM_LABELS } from '@/lib/voice/labels';

export const dynamic = 'force-dynamic';

const TOOLS = [
  {
    href: '/voice/booth',
    title: 'Booth',
    body: 'Record takes, get notes from an AI session director, and keep your keepers.',
  },
  {
    href: '/voice/efforts',
    title: 'Efforts & barks',
    body: 'Attacks, hits, deaths, jumps, callouts and walla — technique, safety and drills.',
  },
  {
    href: '/voice/health',
    title: 'Vocal health',
    body: 'Guided warm-up and a session log that flags when you’re overdoing it.',
  },
];

export default async function VoiceLabPage() {
  const characters = await listVoiceCharacters();

  return (
    <>
      <AppHeader
        title="Voice Lab"
        subtitle="Animation & video game voice work"
        actions={
          <Link
            href="/voice/characters/new"
            className="flex items-center gap-1.5 rounded-md bg-stage-accent px-3 py-1.5 text-xs font-semibold text-stage-onAccent transition-colors hover:bg-stage-accentHover"
          >
            <Icon name="plus" size={14} strokeWidth={2.5} />
            New voice
          </Link>
        }
      />
      <PageBody className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-lg border border-stage-border bg-stage-panel p-4 transition-colors hover:border-stage-accent"
            >
              <span className="flex items-center justify-between text-sm font-semibold text-stage-text">
                {t.title}
                <Icon name="chevronRight" size={15} className="text-stage-subtle group-hover:text-stage-accent" />
              </span>
              <span className="mt-1 block text-xs text-stage-muted">{t.body}</span>
            </Link>
          ))}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-stage-text">Voice cards</h2>
          {characters.length === 0 ? (
            <div className="rounded-lg border border-stage-border bg-stage-panel px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-stage-accentSoft/15 text-stage-accent">
                <Icon name="mic" size={22} />
              </div>
              <h3 className="text-base font-semibold text-stage-text">No voices yet</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-stage-muted">
                A voice card holds everything you need to find a character’s voice again —
                pitch, placement, texture, references, and a reference clip.
              </p>
              <Link
                href="/voice/characters/new"
                className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-stage-accent px-4 py-2 text-sm font-semibold text-stage-onAccent hover:bg-stage-accentHover"
              >
                <Icon name="plus" size={15} strokeWidth={2.5} />
                Create a voice card
              </Link>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-stage-border bg-stage-panel">
              {characters.map((c, i) => (
                <li key={c.id} className={i > 0 ? 'border-t border-stage-border' : undefined}>
                  <Link
                    href={`/voice/characters/${c.id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-stage-panel2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-stage-text">
                        {c.name}
                        {c.project && <span className="font-normal text-stage-muted"> — {c.project}</span>}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-stage-muted">
                        {[c.pitch, c.placement, c.texture].filter((s) => s.trim()).join(' · ') ||
                          'No voice details yet'}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-stage-panel2 px-2 py-0.5 text-[11px] text-stage-muted">
                      {MEDIUM_LABELS[c.medium] ?? c.medium}
                    </span>
                    <Icon name="chevronRight" size={16} className="text-stage-subtle group-hover:text-stage-accent" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageBody>
    </>
  );
}
