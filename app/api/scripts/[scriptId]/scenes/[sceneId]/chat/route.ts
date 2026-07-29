import { NextRequest, NextResponse } from 'next/server';
import { addChatMessage, getAnalysis, getScene, getScript, listChatMessages } from '@/lib/db';
import { buildChatSystemPrompt, toOpenRouterHistory } from '@/lib/prompts';
import { openrouterChatCompletion } from '@/lib/openrouter';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scriptId: string; sceneId: string }> }
) {
  const { sceneId } = await params;
  const messages = await listChatMessages(sceneId);
  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scriptId: string; sceneId: string }> }
) {
  const { scriptId, sceneId } = await params;

  const body = await req.json().catch(() => null);
  const userMessage = body?.message;
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const script = await getScript(scriptId);
  const scene = await getScene(sceneId);
  if (!script || !scene) {
    return NextResponse.json({ error: 'Script or scene not found' }, { status: 404 });
  }
  if (!script.character) {
    return NextResponse.json(
      { error: 'Pick a character for this script before chatting.' },
      { status: 400 }
    );
  }

  const analysis = await getAnalysis(scene.id);

  const systemPrompt = buildChatSystemPrompt({
    character: script.character,
    sceneHeading: scene.heading,
    sceneContent: scene.content,
    momentBefore: analysis?.moment_before,
    givenCircumstances: analysis?.given_circumstances,
  });

  const history = await listChatMessages(scene.id);

  await addChatMessage({ sceneId: scene.id, role: 'user', content: userMessage.trim() });

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

  const assistantRow = await addChatMessage({
    sceneId: scene.id,
    role: 'assistant',
    content: reply,
  });

  return NextResponse.json({ message: assistantRow });
}
