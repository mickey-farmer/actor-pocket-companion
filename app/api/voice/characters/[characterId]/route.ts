import { NextRequest, NextResponse } from 'next/server';
import { deleteVoiceCharacter, getVoiceCharacter, updateVoiceCharacter } from '@/lib/db';
import { parseVoiceCharacterInput } from '@/lib/voice/validate';

type Params = { params: Promise<{ characterId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { characterId } = await params;
  const character = await getVoiceCharacter(characterId);
  if (!character) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ character });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { characterId } = await params;
  const input = parseVoiceCharacterInput(await req.json().catch(() => null));
  if (input.name !== undefined && !input.name) {
    return NextResponse.json({ error: 'Give the character a name.' }, { status: 400 });
  }
  const character = await updateVoiceCharacter(characterId, input);
  if (!character) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ character });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { characterId } = await params;
  await deleteVoiceCharacter(characterId);
  return NextResponse.json({ ok: true });
}
