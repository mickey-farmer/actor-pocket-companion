import { NextRequest, NextResponse } from 'next/server';
import { setScriptCharacter } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  const body = await req.json().catch(() => null);
  const character = body?.character;
  if (!character || typeof character !== 'string' || !character.trim()) {
    return NextResponse.json({ error: 'Character name required' }, { status: 400 });
  }
  await setScriptCharacter(scriptId, character.trim());
  return NextResponse.json({ ok: true });
}
