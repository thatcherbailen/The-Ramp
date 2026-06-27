export type Priority = 'High' | 'Medium' | 'Low';
export type TaskPhase = 'Phase 1' | 'Phase 2' | 'Phase 3';
export type ReadStatus = 'Want to read' | 'Reading' | 'Done';

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
  url?: string;
  notes?: string;
  status: ReadStatus;
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
  targetRole: string;
  city: string;
  dailyCallGoal: number;
  weekStartsMonday: boolean;
  startDate: string;
  targetCompanies: string;
  newsCategories: string[];
  darkMode: boolean;
  defaultScreen: string;
  compactDensity: boolean;
  enableMorningBriefing: boolean;
  enableCallBlock: boolean;
  enableFollowupNudge: boolean;
  enableDailyReadingPick: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  userName: 'Bailen',
  targetRole: 'SDR / BDR',
  city: 'Sydney',
  dailyCallGoal: 60,
  weekStartsMonday: true,
  startDate: '2026-06-01',
  targetCompanies: 'Cloudflare, Datadog, Snowflake, HubSpot, Salesforce',
  newsCategories: ['AI & ML', 'SaaS', 'Sales Tech', 'Cloud', 'CyberSecurity'],
  darkMode: false,
  defaultScreen: 'today',
  compactDensity: false,
  enableMorningBriefing: true,
  enableCallBlock: true,
  enableFollowupNudge: true,
  enableDailyReadingPick: true,
};
