import { NextRequest, NextResponse } from 'next/server';
import { completeDailyChallenge } from '@/lib/db';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const { challengeId } = await params;
  const challenge = await completeDailyChallenge(challengeId);

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  return NextResponse.json({ challenge });
}
