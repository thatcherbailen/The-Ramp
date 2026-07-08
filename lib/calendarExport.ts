// Lightweight calendar export — no OAuth, no account linking. Builds an
// "Add to Google Calendar" link and a downloadable .ics for a single event,
// which covers the common case (get one event into whatever calendar you use)
// without the weight of a full two-way sync.

import { CalendarEvent } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

// "2026-07-08" + "14:30" -> "20260708T143000" (floating local time)
function stamp(date: string, time?: string): string {
  const d = date.replace(/-/g, '');
  if (time && /^\d{2}:\d{2}$/.test(time)) return `${d}T${time.replace(':', '')}00`;
  return d; // all-day
}

// Next calendar day, for all-day end bounds. date: "YYYY-MM-DD"
function nextDay(date: string): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// End time when only a start is set: +1h for timed, all-day otherwise.
function endStamp(ev: CalendarEvent): string {
  if (ev.time && /^\d{2}:\d{2}$/.test(ev.time)) {
    if (ev.endTime && /^\d{2}:\d{2}$/.test(ev.endTime)) return stamp(ev.date, ev.endTime);
    const [h, m] = ev.time.split(':').map(Number);
    const end = new Date(ev.date + 'T00:00:00');
    end.setHours(h + 1, m);
    return `${ev.date.replace(/-/g, '')}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
  }
  return nextDay(ev.date); // all-day: Google/ICS use exclusive end
}

export function googleCalUrl(ev: CalendarEvent): string {
  const start = stamp(ev.date, ev.time);
  const end = endStamp(ev);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${end}`,
  });
  if (ev.notes) params.set('details', ev.notes);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(ev: CalendarEvent): void {
  const dtStart = stamp(ev.date, ev.time);
  const dtEnd = endStamp(ev);
  const allDay = !(ev.time && /^\d{2}:\d{2}$/.test(ev.time));
  const esc = (s: string) => s.replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const stampNow = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Ramp//EN',
    'BEGIN:VEVENT',
    `UID:${ev.id}@theramphq.app`,
    `DTSTAMP:${stampNow}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.notes ? `DESCRIPTION:${esc(ev.notes)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ev.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'event'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
