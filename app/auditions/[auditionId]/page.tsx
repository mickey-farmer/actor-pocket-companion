import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAudition, getScript } from '@/lib/db';
import { buildGoogleCalendarUrl } from '@/lib/calendar';
import AppHeader from '@/components/AppHeader';
import AuditionForm from '@/components/AuditionForm';
import DeleteAuditionButton from '@/components/DeleteAuditionButton';

export const dynamic = 'force-dynamic';

export default async function AuditionDetailPage({
  params,
}: {
  params: Promise<{ auditionId: string }>;
}) {
  const { auditionId } = await params;
  const audition = await getAudition(auditionId);
  if (!audition) notFound();

  const script = audition.script_id ? await getScript(audition.script_id) : null;

  const title = audition.role ? `${audition.project} — ${audition.role}` : audition.project;
  const googleCalendarUrl = audition.audition_date
    ? buildGoogleCalendarUrl({
        title: `Audition: ${title}`,
        startIso: audition.audition_date,
        details: audition.casting_director ? `Casting: ${audition.casting_director}` : undefined,
        location: audition.location || undefined,
      })
    : null;

  return (
    <>
      <AppHeader title={title} backHref="/auditions" backLabel="Auditions" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {audition.audition_date && (
          <div className="flex flex-wrap gap-2">
            <a
              href={googleCalendarUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-stage-border px-3 py-2 text-sm hover:border-stage-accent hover:text-stage-accent"
            >
              Add to Google Calendar
            </a>
            <a
              href={`/api/auditions/${audition.id}/ics`}
              className="rounded border border-stage-border px-3 py-2 text-sm hover:border-stage-accent hover:text-stage-accent"
            >
              Download .ics
            </a>
          </div>
        )}

        {script && (
          <div className="rounded-lg border border-stage-border bg-stage-panel p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Sides attached</div>
            <Link
              href={`/scripts/${script.id}`}
              className="text-sm text-stage-accent underline"
            >
              {script.title}
            </Link>
          </div>
        )}

        <AuditionForm existing={audition} />

        <div className="text-right">
          <DeleteAuditionButton auditionId={audition.id} />
        </div>
      </div>
    </>
  );
}
