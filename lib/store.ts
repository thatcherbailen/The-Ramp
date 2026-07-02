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

// Every key ever written under the old browser-only localStorage scheme —
// used once per account to seed Supabase from whatever's already sitting
// in this browser, the first time that account syncs.
const ALL_KEYS = [
  ...Object.values(KEYS),
  'scc_goals', 'scc_outreach', 'scc_roofing', 'scc_event_cats', 'scc_notes',
];

// Data now lives in Supabase (table `user_data`, one row per key, scoped to
// the signed-in user by RLS) instead of localStorage, so it follows the
// account across devices. `cache` mirrors that table in memory so the rest
// of this file's get/save functions can stay perfectly synchronous — call
// initStore() once after sign-in, before anything else in the app reads.
let cache: Record<string, unknown> | null = null;
let currentUserId: string | null = null;

export async function initStore(userId: string): Promise<void> {
  const { data, error } = await supabase.from('user_data').select('key,value').eq('user_id', userId);
  if (error) throw error;
  cache = {};
  (data || []).forEach(row => { cache![row.key] = row.value; });
  currentUserId = userId;

  if (!data || data.length === 0) {
    // First sync for this account — bring in anything already sitting in
    // this browser's local storage so nothing gets lost in the switch.
    const rows: { user_id: string; key: string; value: unknown }[] = [];
    if (typeof window !== 'undefined') {
      for (const key of ALL_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw == null) continue;
        try {
          const value = JSON.parse(raw);
          cache[key] = value;
          rows.push({ user_id: userId, key, value });
        } catch { /* skip unparseable */ }
      }
    }
    if (rows.length) await supabase.from('user_data').upsert(rows);
  }
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

export function uid(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
