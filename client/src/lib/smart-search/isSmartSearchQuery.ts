const NATURAL_LANGUAGE_SIGNALS =
  /\b(i need|i want|i'?m looking for|looking for|help me find|show me|find me|under\s*\$?\s*\d|below\s*\$?\s*\d|less than|for fps|for gaming|wireless|bluetooth)\b/i;

export function isSmartSearchQuery(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 8) return false;
  if (NATURAL_LANGUAGE_SIGNALS.test(trimmed)) return true;
  return trimmed.split(/\s+/).length >= 5;
}
