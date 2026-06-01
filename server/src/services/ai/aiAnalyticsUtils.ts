export function normalizeAnalyticsQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function groupTopQueries(
  rows: Array<{ query: string }>,
  limit = 10,
): Array<{ query: string; count: number }> {
  const counts = new Map<string, { display: string; count: number }>();

  for (const row of rows) {
    const key = normalizeAnalyticsQuery(row.query);
    if (!key) continue;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { display: row.query.trim(), count: 1 });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => ({ query: entry.display, count: entry.count }));
}

export function formatIntentLabel(intent: string): string {
  return intent
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
