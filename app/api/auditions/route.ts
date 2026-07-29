import { NextRequest, NextResponse } from 'next/server';
import { createAudition, listAuditions, setScriptSourceAudition } from '@/lib/db';
import type { AuditionStatus } from '@/lib/types';

export async function GET() {
  const auditions = await listAuditions();
  return NextResponse.json({ auditions });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const project = body?.project;

  if (!project || typeof project !== 'string' || !project.trim()) {
    return NextResponse.json({ error: 'Project name required' }, { status: 400 });
  }

  const id = await createAudition({
    project: project.trim(),
    role: body?.role || null,
    auditionDate: body?.auditionDate || null,
    location: body?.location || null,
    castingDirector: body?.castingDirector || null,
    status: (body?.status as AuditionStatus) || 'upcoming',
    notes: body?.notes || '',
    scriptId: body?.scriptId || null,
  });

  // Only tag the script as audition-sourced when it was uploaded fresh
  // through this form, not when an already-existing script was chosen.
  if (body?.attachedAsNewSide && body?.scriptId) {
    await setScriptSourceAudition(body.scriptId, id);
  }

  return NextResponse.json({ auditionId: id }, { status: 201 });
}
