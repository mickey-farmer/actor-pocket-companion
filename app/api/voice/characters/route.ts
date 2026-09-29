import { NextRequest, NextResponse } from 'next/server';
import { createVoiceCharacter, listVoiceCharacters } from '@/lib/db';
import { parseVoiceCharacterInput } from '@/lib/voice/validate';

export async function GET() {
  const characters = await listVoiceCharacters();
  return NextResponse.json({ characters });
}

export async function POST(req: NextRequest) {
  const input = parseVoiceCharacterInput(await req.json().catch(() => null));
  if (!input.name) {
    return NextResponse.json({ error: 'Give the character a name.' }, { status: 400 });
  }
  const character = await createVoiceCharacter({ ...input, name: input.name });
  return NextResponse.json({ character });
}
