import Link from 'next/link';
import { listAuditions } from '@/lib/db';
import { formatAuditionDate } from '@/lib/dateInput';
import AppHeader from '@/components/AppHeader';
import StatusBadge from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function AuditionsPage() {
  const auditions = await listAuditions();

  return (
    <>
      <AppHeader title="Auditions" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <Link
          href="/auditions/new"
          className="block w-full rounded bg-stage-accent px-4 py-2 text-center font-medium text-stage-onAccent"
        >
          + New audition
        </Link>

        {auditions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing tracked yet. Add an audition to keep its date, sides, and notes together.
          </p>
        ) : (
          <ul className="space-y-2">
            {auditions.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/auditions/${a.id}`}
                  className="block rounded border border-stage-border bg-stage-panel px-4 py-3 hover:border-stage-accent"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {a.project}
                        {a.role && <span className="text-slate-400"> — {a.role}</span>}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatAuditionDate(a.audition_date)}
                        {a.casting_director && ` · ${a.casting_director}`}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
