export function formatNewsDate(
  rawDate: string | null | undefined,
  mode: 'full' | 'compact' = 'full',
): string {
  if (!rawDate) return '';

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  if (mode === 'compact') {
    return `${month}.${day} ${hours}:${minutes}`;
  }

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}
