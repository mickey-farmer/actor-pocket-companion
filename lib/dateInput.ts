// Helpers for round-tripping a Postgres TIMESTAMPTZ (stored as UTC ISO
// string) through an <input type="datetime-local"> field, which speaks in
// the browser's local time with no timezone info.

export function toLocalDatetimeInputValue(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function toIsoFromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function formatAuditionDate(isoString: string | null | undefined): string {
  if (!isoString) return 'Date TBD';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Date TBD';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
