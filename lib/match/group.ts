export type QueueEntry = {
  userId: string;
  joinedAt: number;
  vibes: number[] | null;
};

export function scorePair(a: number[], b: number[]): number {
  let score = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) score++;
  }
  return score;
}

export function pickBatch(
  entries: QueueEntry[],
  batchSize: number,
): string[] | null {
  if (entries.length < batchSize) return null;

  const sorted = [...entries].sort((x, y) => x.joinedAt - y.joinedAt);
  const seed = sorted[0];

  const ranked = sorted
    .slice(1)
    .map((entry) => ({
      entry,
      score:
        seed.vibes && entry.vibes ? scorePair(seed.vibes, entry.vibes) : -1,
    }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : a.entry.joinedAt - b.entry.joinedAt,
    );

  return [
    seed.userId,
    ...ranked.slice(0, batchSize - 1).map((r) => r.entry.userId),
  ];
}
