import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis, getScene, getScript, listScenes, upsertAnalysis } from '@/lib/db';
import { buildAnalysisMessages } from '@/lib/prompts';
import { extractJsonObject, openrouterChatCompletion } from '@/lib/openrouter';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scriptId: string; sceneId: string }> }
) {
  const { sceneId } = await params;
  const analysis = await getAnalysis(sceneId);
  return NextResponse.json({ analysis });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scriptId: string; sceneId: string }> }
) {
  const { scriptId, sceneId } = await params;

  const script = await getScript(scriptId);
  if (!script) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 });
  }
  if (!script.character) {
    return NextResponse.json(
      { error: 'Pick a character for this script before running the analysis.' },
      { status: 400 }
    );
  }

  const scene = await getScene(sceneId);
  if (!scene) {
    return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get('force') === 'true';

  if (!force) {
    const existing = await getAnalysis(scene.id);
    if (existing) {
      return NextResponse.json({ analysis: existing });
    }
  }

  const allScenes = await listScenes(scriptId);

  const messages = buildAnalysisMessages({
    sceneHeading: scene.heading,
    sceneContent: scene.content,
    character: script.character,
    isFirstScene: scene.scene_index === 0,
    sceneNumber: scene.scene_index + 1,
    totalScenes: allScenes.length,
  });

  let raw: string;
  try {
    raw = await openrouterChatCompletion(messages, { temperature: 0.6, jsonMode: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  let parsed: any;
  try {
    parsed = extractJsonObject(raw);
  } catch (err) {
    return NextResponse.json(
      { error: `The analysis came back in an unexpected format. Try again — ${(err as Error).message}` },
      { status: 502 }
    );
  }

  const analysis = await upsertAnalysis({
    sceneId: scene.id,
    storySummary: parsed.storySummary ?? '',
    characterFit: parsed.characterFit ?? '',
    momentBefore: parsed.momentBefore ?? '',
    givenCircumstances: parsed.givenCircumstances ?? {
      who: '',
      what: '',
      where: '',
      when: '',
      why: '',
    },
    beats: Array.isArray(parsed.beats) ? parsed.beats : [],
  });

  return NextResponse.json({ analysis });
}
