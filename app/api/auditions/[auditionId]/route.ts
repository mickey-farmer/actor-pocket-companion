import { NextRequest, NextResponse } from 'next/server';
import {
  deleteAudition,
  getAudition,
  setScriptSourceAudition,
  updateAudition,
} from '@/lib/db';
import type { AuditionStatus } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ auditionId: string }> }
) {
  const { auditionId } = await params;
  const audition = await getAudition(auditionId);
  if (!audition) {
    return NextResponse.json({ error: 'Audition not found' }, { status: 404 });
  }
  return NextResponse.json({ audition });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ auditionId: string }> }
) {
  const { auditionId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const audition = await updateAudition(auditionId, {
    project: body.project,
    role: body.role,
    auditionDate: body.auditionDate,
    location: body.location,
    castingDirector: body.castingDirector,
    status: body.status as AuditionStatus | undefined,
    notes: body.notes,
    scriptId: body.scriptId,
  });

  if (!audition) {
    return NextResponse.json({ error: 'Audition not found' }, { status: 404 });
  }

  if (body.attachedAsNewSide && body.scriptId) {
    await setScriptSourceAudition(body.scriptId, auditionId);
  }

  return NextResponse.json({ audition });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ auditionId: string }> }
) {
  const { auditionId } = await params;
  await deleteAudition(auditionId);
  return NextResponse.json({ ok: true });
}
