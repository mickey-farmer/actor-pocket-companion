import Link from 'next/link';
import { listAuditions } from '@/lib/db';
import { formatAuditionDate } from '@/lib/dateInput';
import AppHeader from '@/components/AppHeader';
import Icon from '@/components/Icon';
import PageBody from '@/components/PageBody';
import StatusBadge from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function AuditionsPage() {
  const auditions = await listAuditions();
  const isEmpty = auditions.length === 0;

  return (
    <>
      <AppHeader
        title="Auditions"
        subtitle={isEmpty ? undefined : `${auditions.length} tracked`}
        actions={
          <Link
            href="/auditions/new"
            className="flex items-center gap-1.5 rounded-md bg-stage-accent px-3 py-1.5 text-xs font-semibold text-stage-onAccent transition-colors hover:bg-stage-accentHover"
          >
            <Icon name="plus" size={14} strokeWidth={2.5} />
            New
          </Link>
        }
      />
      <PageBody>
        {isEmpty ? (
          <div className="rounded-lg border border-stage-border bg-stage-panel px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-stage-accentSoft/15 text-stage-accent">
              <Icon name="auditions" size={22} />
            </div>
            <h2 className="text-base font-semibold text-stage-text">
              No auditions tracked
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-stage-muted">
              Keep each audition&apos;s date, sides, and notes in one place — and
              add it to your calendar in a tap.
            </p>
            <Link
              href="/auditions/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-stage-accent px-4 py-2 text-sm font-semibold text-stage-onAccent transition-colors hover:bg-stage-accentHover"
            >
              <Icon name="plus" size={15} strokeWidth={2.5} />
              Add an audition
            </Link>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-stage-border bg-stage-panel">
            {auditions.map((a, i) => (
              <li
                key={a.id}
                className={i > 0 ? 'border-t border-stage-border' : undefined}
              >
                <Link
                  href={`/auditions/${a.id}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-stage-panel2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-stage-text">
                      {a.project}
                      {a.role && (
                        <span className="font-normal text-stage-muted">
                          {' '}
                          — {a.role}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-stage-muted">
                      {formatAuditionDate(a.audition_date)}
                      {a.casting_director && ` · ${a.casting_director}`}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                  <Icon
                    name="chevronRight"
                    size={16}
                    className="text-stage-subtle transition-colors group-hover:text-stage-accent"
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
