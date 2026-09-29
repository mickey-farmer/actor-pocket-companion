import { NextRequest, NextResponse } from 'next/server';
import { buildVoiceSuggestionMessages } from '@/lib/prompts';
import { extractJsonObject, openrouterChatCompletion } from '@/lib/openrouter';
import { VOICE_CARD_FIELDS } from '@/lib/types';

// Drafts the descriptive fields of a voice card from a name + breakdown.
// Doesn't save anything — the form shows the suggestion for the actor to edit.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Give the character a name first.' }, { status: 400 });
  }

  const messages = buildVoiceSuggestionMessages({
    name,
    project: typeof body?.project === 'string' ? body.project : '',
    medium: typeof body?.medium === 'string' ? body.medium : 'animation',
    description: typeof body?.description === 'string' ? body.description : '',
  });

  try {
    const raw = await openrouterChatCompletion(messages, { temperature: 0.8, jsonMode: true });
    const parsed = extractJsonObject(raw);
    const suggestion: Record<string, string> = {};
    for (const key of VOICE_CARD_FIELDS) {
      if (typeof parsed?.[key] === 'string') suggestion[key] = parsed[key];
    }
    return NextResponse.json({ suggestion });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
