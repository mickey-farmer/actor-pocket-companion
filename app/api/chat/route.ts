import { NextRequest, NextResponse } from 'next/server';
import { addCoachMessage, clearCoachMessages, listCoachMessages } from '@/lib/db';
import { buildGeneralChatSystemPrompt, toOpenRouterHistory } from '@/lib/prompts';
import { openrouterChatCompletion } from '@/lib/openrouter';

// The general coach chat — not tied to any script.

export async function GET() {
  const messages = await listCoachMessages(null);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const userMessage = body?.message;
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const history = await listCoachMessages(null);
  await addCoachMessage({ scriptId: null, role: 'user', content: userMessage.trim() });

  const messages = [
    { role: 'system' as const, content: buildGeneralChatSystemPrompt() },
    ...toOpenRouterHistory(history),
    { role: 'user' as const, content: userMessage.trim() },
  ];

  let reply: string;
  try {
    reply = await openrouterChatCompletion(messages, { temperature: 0.7 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  const assistantRow = await addCoachMessage({ scriptId: null, role: 'assistant', content: reply });
  return NextResponse.json({ message: assistantRow });
}

export async function DELETE() {
  await clearCoachMessages(null);
  return NextResponse.json({ ok: true });
}
