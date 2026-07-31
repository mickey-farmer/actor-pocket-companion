// Pure helpers for the Daily Challenge feature — date-keying and streak
// math, kept separate from the DB/AI-calling code in lib/db.ts and
// lib/prompts.ts so the logic here is trivial to reason about and test.

/** Today's date as 'YYYY-MM-DD', in UTC (serverless functions don't have a
 * meaningful "local" timezone, so we just pick one consistently). */
export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateKeyMinusDays(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Current streak length, in consecutive days, ending today-or-yesterday.
 * `days` should be one row per distinct challenge_date (most recent
 * generation for that date), in any order — duplicates for the same date
 * are fine since we dedupe into a set.
 *
 * Today doesn't have to be completed yet to keep the streak alive (an
 * actor checking in first thing in the morning shouldn't see their streak
 * reset before they've had a chance to do today's challenge) — but if
 * yesterday also wasn't completed, the streak is 0.
 */
export function computeStreak(
  days: { challengeDate: string; completed: boolean }[]
): number {
  const completedDates = new Set(
    days.filter((d) => d.completed).map((d) => d.challengeDate)
  );

  let streak = 0;
  let cursor = todayDateKey();
  let isToday = true;

  while (true) {
    if (completedDates.has(cursor)) {
      streak++;
    } else if (isToday) {
      // Don't break the streak just because today isn't done yet — but
      // don't count it either. Keep walking backward from yesterday.
    } else {
      break;
    }
    isToday = false;
    cursor = dateKeyMinusDays(cursor, 1);
  }

  return streak;
}
