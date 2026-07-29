import { NextRequest, NextResponse } from 'next/server';
import { deleteScript, getScript, listScenes } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  const script = await getScript(scriptId);
  if (!script) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 });
  }
  const scenes = await listScenes(scriptId);
  return NextResponse.json({ script, scenes });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  await deleteScript(scriptId);
  return NextResponse.json({ ok: true });
}
