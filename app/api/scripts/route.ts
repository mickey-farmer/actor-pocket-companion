import { NextRequest, NextResponse } from 'next/server';
import { createScene, createScript, listScripts } from '@/lib/db';
import { detectScenes, formatFromFilename, parseByFormat } from '@/lib/parsing';

export async function GET() {
  const scripts = await listScripts();
  return NextResponse.json({ scripts });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  const titleField = formData.get('title');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const format = formatFromFilename(file.name);
  if (!format) {
    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a .pdf, .txt, .docx, or .fdx file.' },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let rawText: string;
  try {
    rawText = await parseByFormat(format, buffer);
  } catch (err) {
    return NextResponse.json(
      { error: `Couldn't read that file: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (!rawText || !rawText.trim()) {
    return NextResponse.json(
      { error: "That file came through empty — it may be a scanned image with no selectable text." },
      { status: 400 }
    );
  }

  const title =
    (typeof titleField === 'string' && titleField.trim()) ||
    file.name.replace(/\.[^.]+$/, '');

  const scriptId = await createScript({ title, filename: file.name, format, rawText });

  const scenes = detectScenes(rawText);
  for (const scene of scenes) {
    await createScene({
      scriptId,
      sceneIndex: scene.index,
      heading: scene.heading,
      content: scene.content,
      characters: scene.characters,
    });
  }

  return NextResponse.json({ scriptId }, { status: 201 });
}
