import { NextRequest, NextResponse } from 'next/server';
import { getVoiceTakeAudio } from '@/lib/db';

const EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

// Serves a take's audio for playback, or as a download (?download=1) so it
// can be pulled into a DAW.
export async function GET(req: NextRequest, { params }: { params: Promise<{ takeId: string }> }) {
  const { takeId } = await params;
  const take = await getVoiceTakeAudio(takeId);
  if (!take) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const bytes = Buffer.from(take.audio_base64, 'base64');
  const baseMime = take.mime_type.split(';')[0];
  const headers: Record<string, string> = {
    'Content-Type': baseMime,
    'Content-Length': String(bytes.length),
    'Cache-Control': 'private, max-age=31536000, immutable',
  };
  if (req.nextUrl.searchParams.get('download')) {
    const slug =
      take.line_text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'take';
    const stamp = new Date(take.created_at).toISOString().slice(0, 19).replace(/[:T]/g, '-');
    headers['Content-Disposition'] = `attachment; filename="${slug}-${stamp}.${EXTENSIONS[baseMime] ?? 'webm'}"`;
  }
  return new NextResponse(bytes, { headers });
}
