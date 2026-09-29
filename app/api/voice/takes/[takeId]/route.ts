import { NextRequest, NextResponse } from 'next/server';
import { deleteVoiceTake, updateVoiceTake } from '@/lib/db';

type Params = { params: Promise<{ takeId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { takeId } = await params;
  const body = await req.json().catch(() => null);
  const take = await updateVoiceTake(takeId, {
    isKeeper: typeof body?.isKeeper === 'boolean' ? body.isKeeper : undefined,
    isReference: typeof body?.isReference === 'boolean' ? body.isReference : undefined,
  });
  if (!take) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ take });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { takeId } = await params;
  await deleteVoiceTake(takeId);
  return NextResponse.json({ ok: true });
}
