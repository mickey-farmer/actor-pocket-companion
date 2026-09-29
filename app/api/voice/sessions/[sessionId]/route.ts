import { NextRequest, NextResponse } from 'next/server';
import { deleteVocalSession } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  await deleteVocalSession(sessionId);
  return NextResponse.json({ ok: true });
}
