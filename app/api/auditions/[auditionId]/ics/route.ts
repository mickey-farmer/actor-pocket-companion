import { NextRequest, NextResponse } from 'next/server';
import { getAudition } from '@/lib/db';
import { buildIcs } from '@/lib/calendar';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ auditionId: string }> }
) {
  const { auditionId } = await params;
  const audition = await getAudition(auditionId);

  if (!audition) {
    return NextResponse.json({ error: 'Audition not found' }, { status: 404 });
  }
  if (!audition.audition_date) {
    return NextResponse.json({ error: 'This audition has no date set yet' }, { status: 400 });
  }

  const title = audition.role
    ? `Audition: ${audition.project} (${audition.role})`
    : `Audition: ${audition.project}`;

  const detailsParts = [];
  if (audition.casting_director) detailsParts.push(`Casting: ${audition.casting_director}`);
  if (audition.notes) detailsParts.push(audition.notes);

  const ics = buildIcs({
    uid: `${audition.id}@actor-pocket-companion`,
    title,
    startIso: audition.audition_date,
    details: detailsParts.join('\n\n'),
    location: audition.location || undefined,
  });

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="audition-${audition.id}.ics"`,
    },
  });
}
