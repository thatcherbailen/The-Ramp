export type Priority = 'High' | 'Medium' | 'Low';
export type TaskPhase = 'Phase 1' | 'Phase 2' | 'Phase 3';
export type ReadStatus = 'To read' | 'Reading' | 'Done';

export interface Task {
  id: string;
  phase: TaskPhase;
  week: string;
  priority: Priority;
  task: string;
  notes: string;
  isNew?: boolean;
  done?: boolean;
  due?: string;
  custom?: boolean;
  goalId?: string;
  phaseId?: string;
}

export interface OutreachEntry {
  id: string;
  date: string;
  name: string;
  company: string;
  role: string;
  type: string;
  status: string;
  followup: string;
  referral: string;
  notes: string;
}

export interface RoofingWeek {
  calls: string;
  booked: string;
  held: string;
  sent: string;
  won: string;
}

export interface Target {
  company: string;
  tier: string;
  tierLabel: string;
  hiring: string;
  hiringTone: 'active' | 'watch';
  sells: string;
  prep: string;
}

export interface Phase {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  color?: string;
  targetDate?: string;
  phases: Phase[];
}

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  source: string;
  status: string;
  ote: string;
  nextStep: string;
  contact: string;
  notes: string;
  interviewDate?: string;
}

export interface Call {
  id: string;
  date: string;
  lead: string;
  source: string;
  callNumber: number;
  duration: string;
  outcome: string;
  confidence: number;
  appointmentBooked: boolean;
  appointmentDate?: string;
  jobValue?: string;
  objection: string;
  tone: string;
  response: string;
  worked: string;
  improve: string;
  isInterviewStory: boolean;
  storyTitle?: string;
}

export interface Story {
  id: string;
  date: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  question: string;
}

export interface PrepCard {
  id: string;
  tag: string;
  q: string;
  a: string;
}

export interface Objection {
  id: string;
  tag?: string;
  objection: string;
  response: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  linkedBy: string;
  metWhere: string;
  status: string;
  followupDate?: string;
  extendedNetwork?: string;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  time?: string;
  endTime?: string;
  title: string;
  type: string;
  notes?: string;
  source?: string;
  sourceId?: string;
}

export interface Reading {
  id: string;
  title: string;
  author?: string;
  category: string;
  type?: string;
  url?: string;
  notes?: string;
  status: ReadStatus;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tag: string;
  createdAt: number;
  updatedAt: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  angle: string;
  publishedAt: number;
}

export interface Settings {
  userName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  about?: string;
  targetRole: string;
  city: string;
  dailyCallGoal: number;
  weekStartsMonday: boolean;
  startDate: string;
  targetCompanies: string;
  newsCategories: string[];
  darkMode: boolean;
  nightModeEnabled?: boolean;
  nightModeStart?: string;
  nightModeEnd?: string;
  defaultScreen: string;
  compactDensity: boolean;
  enableMorningBriefing: boolean;
  enableCallBlock: boolean;
  enableFollowupNudge: boolean;
  enableDailyReadingPick: boolean;
  enabledFeatures?: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: Settings = {
  userName: 'there',
  targetRole: 'Sales',
  city: '',
  dailyCallGoal: 30,
  weekStartsMonday: true,
  startDate: '',
  targetCompanies: '',
  newsCategories: ['AI & ML', 'SaaS', 'Sales Tech', 'Cloud', 'CyberSecurity'],
  darkMode: false,
  nightModeEnabled: false,
  nightModeStart: '20:00',
  nightModeEnd: '07:00',
  defaultScreen: 'today',
  compactDensity: false,
  enableMorningBriefing: true,
  enableCallBlock: true,
  enableFollowupNudge: true,
  enableDailyReadingPick: true,
};
