function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a: string[], b: string[]): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}

/** Word-level similarity between a script line and the actor's typed recall attempt. */
export function scoreRecall(
  target: string,
  attempt: string
): { accuracy: number; distance: number } {
  const t = normalizeWords(target);
  const a = normalizeWords(attempt);
  const distance = levenshtein(t, a);
  const maxLen = Math.max(t.length, a.length, 1);
  const accuracy = Math.max(0, Math.round((1 - distance / maxLen) * 100));
  return { accuracy, distance };
}
