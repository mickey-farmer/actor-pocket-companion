import { NextRequest, NextResponse } from 'next/server';
import { updateSceneNotes } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scriptId: string; sceneId: string }> }
) {
  const { sceneId } = await params;
  const body = await req.json().catch(() => null);
  const notes = body?.notes;

  if (typeof notes !== 'string') {
    return NextResponse.json({ error: 'Notes must be a string' }, { status: 400 });
  }

  await updateSceneNotes(sceneId, notes);
  return NextResponse.json({ ok: true });
}
