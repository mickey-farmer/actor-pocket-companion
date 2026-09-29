import { NextRequest, NextResponse } from 'next/server';
import { getVoiceCharacter } from '@/lib/db';
import { buildDirectorMessages, describeVoiceCard } from '@/lib/prompts';
import { openrouterChatCompletion } from '@/lib/openrouter';

const str = (v: unknown, max = 5000) => (typeof v === 'string' ? v.slice(0, max) : '');

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const characterId = str(body?.characterId, 100);
  const character = characterId ? await getVoiceCharacter(characterId) : null;
  const previousNotes = Array.isArray(body?.previousNotes)
    ? body.previousNotes.filter((n: unknown) => typeof n === 'string').slice(-12)
    : [];

  const messages = buildDirectorMessages({
    voiceCard: character ? describeVoiceCard(character) : null,
    lineText: str(body?.lineText),
    context: str(body?.context),
    takeNumber: Number.isFinite(body?.takeNumber) ? body.takeNumber : previousNotes.length + 1,
    previousNotes,
    actorNote: str(body?.actorNote, 2000),
  });

  try {
    const note = await openrouterChatCompletion(messages, { temperature: 0.9 });
    return NextResponse.json({ note: note.trim() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
