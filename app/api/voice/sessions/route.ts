import { NextRequest, NextResponse } from 'next/server';
import { createVocalSession, listVocalSessions } from '@/lib/db';
import { isVocalSessionKind } from '@/lib/voice/validate';

export async function GET() {
  const sessions = await listVocalSessions();
  return NextResponse.json({ sessions });
}

const clampInt = (v: unknown, min: number, max: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v as number))) : null;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionDate = typeof body?.sessionDate === 'string' ? body.sessionDate : '';
  const minutes = clampInt(body?.minutes, 1, 600);
  const intensity = clampInt(body?.intensity, 1, 5);
  const voiceFeel = clampInt(body?.voiceFeel, 1, 5);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || !isVocalSessionKind(body?.kind)) {
    return NextResponse.json({ error: 'Date and session type are required.' }, { status: 400 });
  }
  if (minutes === null || intensity === null || voiceFeel === null) {
    return NextResponse.json({ error: 'Minutes, intensity and voice feel are required.' }, { status: 400 });
  }

  const session = await createVocalSession({
    sessionDate,
    kind: body.kind,
    minutes,
    intensity,
    voiceFeel,
    notes: typeof body?.notes === 'string' ? body.notes.slice(0, 2000) : '',
  });
  return NextResponse.json({ session });
}
