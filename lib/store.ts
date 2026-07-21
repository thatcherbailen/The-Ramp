'use client';
import { Task, Job, Call, Story, PrepCard, Objection, Contact, CalendarEvent, Reading, NewsItem, Settings, Goal, OutreachEntry, RoofingWeek, Note, DEFAULT_SETTINGS } from './types';
import { DEFAULT_GOAL, SEED_READING } from './seedData';
import { supabase } from './supabase';

const KEYS = {
  tasks: 'scc_tasks_done',
  taskEdits: 'scc_task_edits',
  taskDeletes: 'scc_task_deletes',
  taskCustom: 'scc_task_custom',
  jobs: 'scc_jobs',
  calls: 'scc_calls',
  stories: 'scc_stories',
  prep: 'scc_prep',
  objections: 'scc_objections',
  contacts: 'scc_contacts',
  events: 'scc_events',
  reading: 'scc_reading',
  news: 'scc_news',
  newsStamp: 'scc_news_stamp',
  settings: 'scc_settings',
};

// Data lives in Supabase (table `user_data`, one row per key, scoped to the
// signed-in user by RLS) instead of localStorage, so it follows the account
// across devices. `cache` mirrors that table in memory so the rest of this
// file's get/save functions can stay perfectly synchronous — call
// initStore() once after sign-in, before anything else in the app reads.
//
// Every account starts empty. This deliberately does NOT seed new accounts
// from whatever's sitting in the browser's old localStorage — that one-time
// migration was only for carrying over pre-account data during the initial
// cutover, and leaving it in would leak that data into every new signup
// made from the same browser (e.g. while testing).
let cache: Record<string, unknown> | null = null;
let currentUserId: string | null = null;

export async function initStore(userId: string): Promise<void> {
  const { data, error } = await supabase.from('user_data').select('key,value').eq('user_id', userId);
  if (error) throw error;
  cache = {};
  (data || []).forEach(row => { cache![row.key] = row.value; });
  currentUserId = userId;
}

export function clearStore(): void {
  cache = null;
  currentUserId = null;
}

function load<T>(key: string, fallback: T): T {
  if (!cache) return fallback;
  return key in cache ? (cache[key] as T) : fallback;
}

function save(key: string, val: unknown) {
  if (!cache || !currentUserId) return;
  cache[key] = val;
  supabase.from('user_data').upsert({ user_id: currentUserId, key, value: val }).then(({ error }) => {
    if (error) console.error(`Failed to save "${key}"`, error);
  });
}

// ── Tasks ──────────────────────────────────────────────────────────
export function getTaskDone(): Record<string, boolean> { return load(KEYS.tasks, {}); }
export function setTaskDone(id: string, done: boolean) {
  const d = getTaskDone(); d[id] = done; save(KEYS.tasks, d);
}
export function getTaskEdits(): Record<string, Partial<Task>> { return load(KEYS.taskEdits, {}); }
export function saveTaskEdit(id: string, patch: Partial<Task>) {
  const e = getTaskEdits(); e[id] = patch; save(KEYS.taskEdits, e);
}
export function getTaskDeletes(): Set<string> { return new Set(load(KEYS.taskDeletes, [])); }
export function deleteTask(id: string) {
  const d = getTaskDeletes(); d.add(id); save(KEYS.taskDeletes, [...d]);
}
export function getCustomTasks(): Task[] { return load(KEYS.taskCustom, []); }
export function saveCustomTask(t: Task) {
  const arr = getCustomTasks();
  const idx = arr.findIndex(x => x.id === t.id);
  if (idx >= 0) arr[idx] = t; else arr.push(t);
  save(KEYS.taskCustom, arr);
}
export function deleteCustomTask(id: string) {
  save(KEYS.taskCustom, getCustomTasks().filter(x => x.id !== id));
}

// ── Goals (each goal owns its phases) ─────────────────────────────
export function getGoals(): Goal[] {
  const g = load<Goal[] | null>('scc_goals', null);
  if (!g || !g.length) { save('scc_goals', [DEFAULT_GOAL]); return [DEFAULT_GOAL]; }
  return g;
}
export function saveGoal(goal: Goal) {
  const arr = getGoals();
  const i = arr.findIndex(x => x.id === goal.id);
  if (i >= 0) arr[i] = goal; else arr.push(goal);
  save('scc_goals', arr);
}
export function deleteGoal(id: string) {
  save('scc_goals', getGoals().filter(x => x.id !== id));
}

// ── Outreach tracker ──────────────────────────────────────────────
export function getOutreach(): OutreachEntry[] { return load('scc_outreach', []); }
export function saveOutreach(o: OutreachEntry) {
  const arr = getOutreach(); const i = arr.findIndex(x => x.id === o.id);
  if (i >= 0) arr[i] = o; else arr.push(o); save('scc_outreach', arr);
}
export function deleteOutreach(id: string) { save('scc_outreach', getOutreach().filter(x => x.id !== id)); }

// ── Roofing weekly metrics (keyed by week label) ──────────────────
export function getRoofing(): Record<string, RoofingWeek> { return load('scc_roofing', {}); }
export function saveRoofingWeek(week: string, data: RoofingWeek) {
  const all = getRoofing(); all[week] = data; save('scc_roofing', all);
}

// ── Jobs ──────────────────────────────────────────────────────────
export function getJobs(): Job[] { return load(KEYS.jobs, []); }
export function saveJob(j: Job) {
  const arr = getJobs(); const idx = arr.findIndex(x => x.id === j.id);
  if (idx >= 0) arr[idx] = j; else arr.push(j); save(KEYS.jobs, arr);
}
export function deleteJob(id: string) { save(KEYS.jobs, getJobs().filter(x => x.id !== id)); }

// ── Calls ──────────────────────────────────────────────────────────
export function getCalls(): Call[] { return load(KEYS.calls, []); }
export function saveCall(c: Call) {
  const arr = getCalls(); const idx = arr.findIndex(x => x.id === c.id);
  if (idx >= 0) arr[idx] = c; else arr.push(c); save(KEYS.calls, arr);
}
export function deleteCall(id: string) { save(KEYS.calls, getCalls().filter(x => x.id !== id)); }

// ── Stories ──────────────────────────────────────────────────────
export function getStories(): Story[] { return load(KEYS.stories, []); }
export function saveStory(s: Story) {
  const arr = getStories(); const idx = arr.findIndex(x => x.id === s.id);
  if (idx >= 0) arr[idx] = s; else arr.push(s); save(KEYS.stories, arr);
}
export function deleteStory(id: string) { save(KEYS.stories, getStories().filter(x => x.id !== id)); }

// ── Prep ──────────────────────────────────────────────────────────
export function getPrepCards(): PrepCard[] { return load(KEYS.prep, []); }
export function savePrepCard(c: PrepCard) {
  const arr = getPrepCards(); const idx = arr.findIndex(x => x.id === c.id);
  if (idx >= 0) arr[idx] = c; else arr.push(c); save(KEYS.prep, arr);
}
export function deletePrepCard(id: string) { save(KEYS.prep, getPrepCards().filter(x => x.id !== id)); }

// ── Objections ──────────────────────────────────────────────────────
export function getObjections(): Objection[] { return load(KEYS.objections, []); }
export function saveObjection(o: Objection) {
  const arr = getObjections(); const idx = arr.findIndex(x => x.id === o.id);
  if (idx >= 0) arr[idx] = o; else arr.push(o); save(KEYS.objections, arr);
}
export function deleteObjection(id: string) { save(KEYS.objections, getObjections().filter(x => x.id !== id)); }

// ── Contacts ──────────────────────────────────────────────────────
export function getContacts(): Contact[] { return load(KEYS.contacts, []); }
export function saveContact(c: Contact) {
  const arr = getContacts(); const idx = arr.findIndex(x => x.id === c.id);
  if (idx >= 0) arr[idx] = c; else arr.push(c); save(KEYS.contacts, arr);
}
export function deleteContact(id: string) { save(KEYS.contacts, getContacts().filter(x => x.id !== id)); }

// ── Calendar Events ──────────────────────────────────────────────────────
export function getEvents(): CalendarEvent[] { return load(KEYS.events, []); }
export function saveEvent(e: CalendarEvent) {
  const arr = getEvents(); const idx = arr.findIndex(x => x.id === e.id);
  if (idx >= 0) arr[idx] = e; else arr.push(e); save(KEYS.events, arr);
}
export function deleteEvent(id: string) { save(KEYS.events, getEvents().filter(x => x.id !== id)); }

// Custom calendar categories (name + colour), shown in the legend
export interface EventCat { name: string; color: string; }
export function getEventCats(): EventCat[] { return load('scc_event_cats', []); }
export function saveEventCat(c: EventCat) {
  const arr = getEventCats();
  const idx = arr.findIndex(x => x.name.toLowerCase() === c.name.toLowerCase());
  if (idx >= 0) arr[idx] = c; else arr.push(c);
  save('scc_event_cats', arr);
}
export function deleteEventCat(name: string) { save('scc_event_cats', getEventCats().filter(x => x.name !== name)); }

// ── Reading ──────────────────────────────────────────────────────
export function getReading(): Reading[] {
  const r = load<Reading[] | null>(KEYS.reading, null);
  if (r === null) { save(KEYS.reading, SEED_READING); return SEED_READING; }
  return r;
}
export function saveReading(r: Reading) {
  const arr = getReading(); const idx = arr.findIndex(x => x.id === r.id);
  if (idx >= 0) arr[idx] = r; else arr.push(r); save(KEYS.reading, arr);
}
export function deleteReading(id: string) { save(KEYS.reading, getReading().filter(x => x.id !== id)); }

// ── News ──────────────────────────────────────────────────────────
export function getNews(): NewsItem[] { return load(KEYS.news, []); }
export function setNews(items: NewsItem[]) { save(KEYS.news, items); }
export function getNewsStamp(): number { return load(KEYS.newsStamp, 0); }
export function setNewsStamp(n: number) { save(KEYS.newsStamp, n); }

// ── Notes ──────────────────────────────────────────────────────────
export function getNotes(): Note[] { return load('scc_notes', []); }
export function saveNote(n: Note) {
  const arr = getNotes(); const idx = arr.findIndex(x => x.id === n.id);
  if (idx >= 0) arr[idx] = n; else arr.unshift(n);
  save('scc_notes', arr);
}
export function deleteNote(id: string) { save('scc_notes', getNotes().filter(x => x.id !== id)); }

// ── Settings ──────────────────────────────────────────────────────────
export function getSettings(): Settings { return { ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) }; }
export function saveSettings(s: Settings) { save(KEYS.settings, s); }

// ── Call insights (AI growth summary, cached by input signature) ──────
// The dashboard summary is generated from the call reflections. We cache the
// result alongside a signature of those reflections so it only regenerates
// when the underlying notes actually change (avoids a call on every view).
export interface CallInsights {
  summary: string;
  strengths: { title: string; note: string }[];
  growth: { title: string; note: string }[];
}
export function getCallInsights(): { sig: string; data: CallInsights } | null {
  return load<{ sig: string; data: CallInsights } | null>('scc_call_insights', null);
}
export function saveCallInsights(sig: string, data: CallInsights) {
  save('scc_call_insights', { sig, data });
}

// ── Practice streak ──────────────────────────────────────────────────
// One entry per calendar day (YYYY-MM-DD) a drill (objection or story) was
// completed. Dedup'd on write so repeated reps in a day don't double count.
const PRACTICE_KEY = 'scc_practice_log';
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function getPracticeDates(): string[] { return load(PRACTICE_KEY, []); }

export function logPracticeToday(): void {
  const today = dayKey(new Date());
  const dates = getPracticeDates();
  if (!dates.includes(today)) save(PRACTICE_KEY, [...dates, today]);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('scc:practice-logged'));
}

export interface Streak { current: number; longest: number; today: boolean }

export function getStreak(): Streak {
  const dates = new Set(getPracticeDates());
  const today = dayKey(new Date());
  const hasToday = dates.has(today);

  let current = 0;
  const cursor = new Date();
  if (!hasToday) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longest = 0, run = 0, prevDay: Date | null = null;
  for (const key of [...dates].sort()) {
    const d = new Date(key + 'T00:00:00');
    if (prevDay) {
      const expected = new Date(prevDay);
      expected.setDate(expected.getDate() + 1);
      run = dayKey(expected) === key ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prevDay = d;
  }

  return { current, longest, today: hasToday };
}

// ── Hidden seed items ────────────────────────────────────────────────
// The built-in example content (stories, prep cards, objections) can be
// deleted per-user; editing one saves a user copy under the same id, which
// shadows the seed version. This tracks the deletions.
const SEED_HIDDEN_KEY = 'scc_seed_hidden';
export function getSeedHidden(kind: string): Set<string> {
  const all = load<Record<string, string[]>>(SEED_HIDDEN_KEY, {});
  return new Set(all[kind] || []);
}
export function hideSeedItem(kind: string, id: string) {
  const all = load<Record<string, string[]>>(SEED_HIDDEN_KEY, {});
  all[kind] = [...new Set([...(all[kind] || []), id])];
  save(SEED_HIDDEN_KEY, all);
}

// Merge built-in examples with the user's own items: user items with the
// same id replace ("shadow") the seed version, hidden seeds are dropped.
export function mergeSeed<T extends { id: string }>(kind: string, seed: T[], user: T[]): T[] {
  const hidden = getSeedHidden(kind);
  const userIds = new Set(user.map(u => u.id));
  return [...seed.filter(s => !hidden.has(s.id) && !userIds.has(s.id)), ...user];
}

// ── Drill results & logs (objection drills + mock calls) ─────────────
// Each completed drill/call is stored with its full detail so it can be
// shown in a history list and re-opened. The score+kind fields keep the
// readiness score working unchanged.
export interface DrillDetail {
  scenario?: string;        // mock call scenario label
  title?: string;           // short label for the list row
  summary?: string;         // one-line verdict
  objection?: string;       // objection drill: the prompt
  response?: string;        // objection drill: the rep's answer
  criteria?: { label: string; met: boolean; note: string }[];
  transcript?: { role: 'prospect' | 'rep'; text: string }[]; // mock call
  strengths?: string[];
  improvements?: string[];
}
export interface DrillResult { id: string; ts?: number; date: string; kind: 'objection' | 'mockcall'; score: number; detail?: DrillDetail }
const DRILL_RESULTS_KEY = 'scc_drill_results';
export function getDrillResults(): DrillResult[] { return load(DRILL_RESULTS_KEY, []); }
export function logDrillResult(kind: DrillResult['kind'], score: number, detail?: DrillDetail) {
  const arr = getDrillResults();
  arr.push({ id: uid(), ts: Date.now(), date: new Date().toISOString().slice(0, 10), kind, score, detail });
  save(DRILL_RESULTS_KEY, arr.slice(-200));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('scc:practice-logged'));
}
// History for a given kind, newest first.
export function getDrillLog(kind: DrillResult['kind']): DrillResult[] {
  return getDrillResults().filter(r => r.kind === kind).reverse();
}
export function deleteDrillLog(id: string) {
  save(DRILL_RESULTS_KEY, getDrillResults().filter(r => r.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('scc:practice-logged'));
}

// ── Readiness score ──────────────────────────────────────────────────
// One 0-100 number tying practice together: mock call scores (40%),
// objection drill scores (30%), consistency over the last 14 days (20%),
// story bank depth (10%). Components with no data contribute 0, so the
// score starts low and grows with real practice.
export interface Readiness {
  score: number;
  mockCalls: number;   // avg of last 5, 0 if none
  objections: number;  // avg of last 10, 0 if none
  consistency: number; // practice days in last 14 / 7, capped at 100
  stories: number;     // stories saved / 5, capped at 100
}

export function getReadiness(storyCount: number): Readiness {
  const results = getDrillResults();
  const mock = results.filter(r => r.kind === 'mockcall').slice(-5);
  const obj = results.filter(r => r.kind === 'objection').slice(-10);
  const mockCalls = mock.length ? Math.round(mock.reduce((s, r) => s + r.score, 0) / mock.length) : 0;
  const objections = obj.length ? Math.round(obj.reduce((s, r) => s + r.score, 0) / obj.length) : 0;

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const cutoff = dayKey(twoWeeksAgo);
  const recentDays = getPracticeDates().filter(d => d >= cutoff).length;
  const consistency = Math.min(100, Math.round((recentDays / 7) * 100));

  const stories = Math.min(100, Math.round((storyCount / 5) * 100));

  const score = Math.round(mockCalls * 0.4 + objections * 0.3 + consistency * 0.2 + stories * 0.1);
  return { score, mockCalls, objections, consistency, stories };
}

// ── Dismissible UI flags (banners, tips) ─────────────────────────────
const FLAGS_KEY = 'scc_ui_flags';
export function isDismissed(flag: string): boolean {
  return !!load<Record<string, boolean>>(FLAGS_KEY, {})[flag];
}
export function dismissFlag(flag: string) {
  const all = load<Record<string, boolean>>(FLAGS_KEY, {});
  all[flag] = true;
  save(FLAGS_KEY, all);
}

export function uid(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
