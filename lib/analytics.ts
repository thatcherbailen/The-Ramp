// Time-range + bucketing helpers for the dashboard breakdowns and trend charts.
// Everything works off 'YYYY-MM-DD' date strings, which sort and compare
// lexicographically, so range filtering is a plain string comparison.

export type RangeKey = 'week' | 'month' | 'quarter' | 'half' | 'year' | 'all';

export const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'quarter', label: 'Quarter', days: 90 },
  { key: 'half', label: '6 months', days: 182 },
  { key: 'year', label: 'Year', days: 365 },
  { key: 'all', label: 'All time', days: null },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(s + 'T00:00:00');

// Inclusive start date (YYYY-MM-DD) for a range. For 'all', falls back to the
// earliest data date (or today if there's none yet).
export function rangeStart(key: RangeKey, earliest: string): string {
  const range = RANGES.find(r => r.key === key);
  if (!range || range.days === null) return earliest;
  const d = new Date();
  d.setDate(d.getDate() - (range.days - 1));
  return iso(d);
}

export interface Bucket { start: Date; end: Date; label: string }

// Build evenly-spaced buckets spanning [start, today], choosing daily / weekly /
// monthly granularity by span so a chart never renders hundreds of bars.
export function buildBuckets(startISO: string): Bucket[] {
  const start = parse(startISO);
  const end = new Date(); end.setHours(0, 0, 0, 0);
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const buckets: Bucket[] = [];

  if (spanDays <= 31) {
    // Daily
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const s = new Date(d);
      buckets.push({ start: s, end: s, label: `${s.getDate()}/${s.getMonth() + 1}` });
    }
  } else if (spanDays <= 126) {
    // Weekly (anchored to the start day)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
      const s = new Date(d);
      const e = new Date(d); e.setDate(e.getDate() + 6);
      buckets.push({ start: s, end: e, label: `${s.getDate()}/${s.getMonth() + 1}` });
    }
  } else {
    // Monthly
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) {
      const s = new Date(d);
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = spanDays > 366 ? `${MONTHS[s.getMonth()]} ${String(s.getFullYear()).slice(2)}` : MONTHS[s.getMonth()];
      buckets.push({ start: s, end: e, label });
      d.setMonth(d.getMonth() + 1);
    }
  }
  return buckets;
}

// Sum a value across items into aligned buckets, keyed by each item's date.
export function bucketValues<T>(buckets: Bucket[], items: T[], dateOf: (t: T) => string, valueOf: (t: T) => number): number[] {
  const out = new Array(buckets.length).fill(0);
  for (const item of items) {
    const ds = dateOf(item);
    if (!ds) continue;
    const t = parse(ds).getTime();
    for (let i = 0; i < buckets.length; i++) {
      const s = buckets[i].start.getTime();
      const e = buckets[i].end.getTime() + 86400000 - 1; // inclusive end-of-day
      if (t >= s && t <= e) { out[i] += valueOf(item); break; }
    }
  }
  return out;
}
