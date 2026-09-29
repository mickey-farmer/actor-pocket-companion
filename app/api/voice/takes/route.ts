import { NextRequest, NextResponse } from 'next/server';
import { createVoiceTake, getVoiceCharacter, listVoiceTakes } from '@/lib/db';

// Base64 inflates by ~4/3; this keeps a request under Vercel's ~4.5 MB body
// limit while still allowing several minutes of Opus audio.
const MAX_AUDIO_BASE64_LENGTH = 4_000_000;

export async function GET(req: NextRequest) {
  const characterId = req.nextUrl.searchParams.get('characterId') || null;
  const takes = await listVoiceTakes(characterId);
  return NextResponse.json({ takes });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const audioBase64 = body?.audioBase64;
  const mimeType = body?.mimeType;
  if (typeof audioBase64 !== 'string' || !audioBase64 || typeof mimeType !== 'string') {
    return NextResponse.json({ error: 'Audio required' }, { status: 400 });
  }
  if (!mimeType.startsWith('audio/')) {
    return NextResponse.json({ error: 'Unsupported audio type' }, { status: 400 });
  }
  if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
    return NextResponse.json(
      { error: 'That take is too long to save here — keep booth takes under a few minutes.' },
      { status: 413 }
    );
  }

  const characterId = typeof body?.characterId === 'string' && body.characterId ? body.characterId : null;
  if (characterId && !(await getVoiceCharacter(characterId))) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  const take = await createVoiceTake({
    characterId,
    lineText: typeof body?.lineText === 'string' ? body.lineText.slice(0, 5000) : '',
    direction: typeof body?.direction === 'string' ? body.direction.slice(0, 2000) : '',
    mimeType,
    durationMs: Number.isFinite(body?.durationMs) ? Math.max(0, Math.round(body.durationMs)) : 0,
    audioBase64,
  });
  return NextResponse.json({ take });
}
