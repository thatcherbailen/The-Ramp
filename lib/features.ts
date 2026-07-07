export interface FeatureDef {
  key: string;
  href: string;
  label: string;
  group: string;
  desc: string;
}

// Optional nav features a user can hide. Today, Calendar and Task Tracker
// are always on — the app doesn't work without them.
export const OPTIONAL_FEATURES: FeatureDef[] = [
  { key: 'notes', href: '/notes', label: 'Notes', group: 'Prep', desc: 'Free-form notes for calls, prep and meetings' },
  { key: 'calls', href: '/calls', label: 'Call Log', group: 'Pipeline', desc: 'Log dials, track appointment rate and revenue' },
  { key: 'jobs', href: '/jobs', label: 'Job Tracker', group: 'Pipeline', desc: 'Pipeline, targets, outreach and applications' },
  { key: 'networking', href: '/networking', label: 'Networking', group: 'Pipeline', desc: 'Contacts, warm intros and follow-ups' },
  { key: 'roleplay', href: '/roleplay', label: 'Mock Call', group: 'Prep', desc: 'AI roleplay — practice live calls and get scored' },
  { key: 'stories', href: '/stories', label: 'Story Bank', group: 'Prep', desc: 'STAR stories for interviews' },
  { key: 'prep', href: '/prep', label: 'Interview Prep', group: 'Prep', desc: 'Flashcard question drills' },
  { key: 'objections', href: '/objections', label: 'Objection Drill', group: 'Prep', desc: 'Objection-handling practice' },
  { key: 'news', href: '/news', label: 'Tech News', group: 'Learn', desc: 'Curated headlines with an interview angle' },
  { key: 'reading', href: '/reading', label: 'Reading List', group: 'Learn', desc: 'Books, articles and podcasts' },
];

export function isFeatureEnabled(enabled: Record<string, boolean> | undefined, key: string): boolean {
  return enabled?.[key] !== false;
}

export interface Preset {
  label: string;
  desc: string;
  enabled: string[];
}

export const PRESETS: Record<string, Preset> = {
  jobseeker: {
    label: 'Getting into sales',
    desc: 'Job-search focus — pipeline, prep and networking',
    enabled: ['jobs', 'networking', 'roleplay', 'stories', 'prep', 'objections', 'news', 'reading', 'notes'],
  },
  active: {
    label: 'Already in sales',
    desc: 'Day-to-day selling — calls, notes and pipeline',
    enabled: ['calls', 'notes', 'jobs', 'roleplay', 'objections'],
  },
  all: {
    label: 'Everything',
    desc: 'Show every feature',
    enabled: OPTIONAL_FEATURES.map(f => f.key),
  },
};

export function presetToEnabledMap(keys: string[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  OPTIONAL_FEATURES.forEach(f => { map[f.key] = keys.includes(f.key); });
  return map;
}
