// Calendar helpers with zero external dependencies and no OAuth — just a
// prefilled Google Calendar URL, or a downloadable .ics file that works with
// Google Calendar, Apple Calendar, Outlook, etc.

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

const DEFAULT_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function buildGoogleCalendarUrl(input: {
  title: string;
  startIso: string;
  details?: string;
  location?: string;
}): string {
  const start = new Date(input.startIso);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
  });
  if (input.details) params.set('details', input.details);
  if (input.location) params.set('location', input.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(input: {
  uid: string;
  title: string;
  startIso: string;
  details?: string;
  location?: string;
}): string {
  const start = new Date(input.startIso);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Actor Pocket Companion//EN',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
  ];
  if (input.details) lines.push(`DESCRIPTION:${escapeIcsText(input.details)}`);
  if (input.location) lines.push(`LOCATION:${escapeIcsText(input.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}
