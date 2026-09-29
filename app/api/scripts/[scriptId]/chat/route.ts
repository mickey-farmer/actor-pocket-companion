import { NextRequest, NextResponse } from 'next/server';
import {
  addCoachMessage,
  clearCoachMessages,
  getScript,
  listCoachMessages,
  listScenes,
} from '@/lib/db';
import { buildScriptChatSystemPrompt, toOpenRouterHistory } from '@/lib/prompts';
import { openrouterChatCompletion } from '@/lib/openrouter';

// Chat about a whole script (as opposed to the per-scene chat under
// scenes/[sceneId]/chat, which is scoped to one scene).

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  const messages = await listCoachMessages(scriptId);
  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;

  const body = await req.json().catch(() => null);
  const userMessage = body?.message;
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const script = await getScript(scriptId);
  if (!script) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 });
  }
  const scenes = await listScenes(script.id);

  const systemPrompt = buildScriptChatSystemPrompt({
    title: script.title,
    character: script.character,
    rawText: script.raw_text,
    sceneHeadings: scenes.map((s) => s.heading),
  });

  const history = await listCoachMessages(script.id);
  await addCoachMessage({ scriptId: script.id, role: 'user', content: userMessage.trim() });

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...toOpenRouterHistory(history),
    { role: 'user' as const, content: userMessage.trim() },
  ];

  let reply: string;
  try {
    reply = await openrouterChatCompletion(messages, { temperature: 0.8 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  const assistantRow = await addCoachMessage({
    scriptId: script.id,
    role: 'assistant',
    content: reply,
  });
  return NextResponse.json({ message: assistantRow });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  await clearCoachMessages(scriptId);
  return NextResponse.json({ ok: true });
}
