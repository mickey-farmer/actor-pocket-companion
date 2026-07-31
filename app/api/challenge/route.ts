import { NextResponse } from 'next/server';
import {
  createDailyChallenge,
  getDailyChallenge,
  getLatestChallengeForDate,
  listRecentChallenges,
} from '@/lib/db';
import { buildDailyChallengeMessages } from '@/lib/prompts';
import { extractJsonObject, openrouterChatCompletion } from '@/lib/openrouter';
import { computeStreak, todayDateKey } from '@/lib/challenge';

async function generateAndStoreChallenge(date: string) {
  const recent = await listRecentChallenges(10);
  const messages = buildDailyChallengeMessages({
    recentPromptTexts: recent.map((c) => c.prompt_text),
  });

  const raw = await openrouterChatCompletion(messages, {
    temperature: 0.9,
    jsonMode: true,
  });
  const parsed = extractJsonObject(raw);

  const id = await createDailyChallenge({
    challengeDate: date,
    category: typeof parsed.category === 'string' ? parsed.category : 'imagination',
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : "Today's Challenge",
    promptText: typeof parsed.prompt === 'string' ? parsed.prompt : '',
    durationMinutes:
      typeof parsed.durationMinutes === 'number' ? parsed.durationMinutes : null,
  });

  return getDailyChallenge(id);
}

async function buildResponsePayload() {
  const recentForStreak = await listRecentChallenges(60);
  const streak = computeStreak(
    recentForStreak.map((c) => ({
      challengeDate: c.challenge_date,
      completed: !!c.completed_at,
    }))
  );
  return { streak, history: recentForStreak.slice(0, 14) };
}

/** Fetches today's challenge, generating one via AI if none exists yet for today. */
export async function GET() {
  const today = todayDateKey();
  let challenge = await getLatestChallengeForDate(today);

  if (!challenge) {
    try {
      challenge = await generateAndStoreChallenge(today);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 502 });
    }
  }

  const { streak, history } = await buildResponsePayload();
  return NextResponse.json({ challenge, streak, history });
}

/** Manual refresh — always generates a brand-new challenge for today. */
export async function POST() {
  const today = todayDateKey();

  let challenge;
  try {
    challenge = await generateAndStoreChallenge(today);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  const { streak, history } = await buildResponsePayload();
  return NextResponse.json({ challenge, streak, history });
}
