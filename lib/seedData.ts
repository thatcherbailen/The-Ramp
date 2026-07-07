import { Task, Story, PrepCard, Objection, Goal, TaskPhase, Target, Reading } from './types';

export const SEED_READING: Reading[] = [
  { id:'r1', title:'Fanatical Prospecting', author:'Jeb Blount', category:'Sales & Prospecting', type:'Book', status:'To read', url:'https://www.google.com/search?q=Fanatical+Prospecting+Jeb+Blount', notes:'The cold-calling bible — consistent outreach beats talent. A great first read for anyone in outbound.' },
  { id:'r2', title:'30 Minutes to President’s Club', author:'Armstrong & Cohen', category:'Sales & Prospecting', type:'Podcast', status:'To read', url:'https://www.30mpc.com', notes:'Tactical sales tips in short episodes — good commute listening.' },
  { id:'r3', title:'Gap Selling', author:'Keenan', category:'Sales & Prospecting', type:'Book', status:'To read', url:'https://www.google.com/search?q=Gap+Selling+Keenan', notes:'Problem-centric selling — understand the gap between where the buyer is and where they want to be.' },
];

// Example target companies — shows how the tiering works. Users research and
// swap in their own; these are recognisable names, not personal picks.
export const SEED_TARGETS: Target[] = [
  { company:'Salesforce', tier:'stretch', tierLabel:'Example · dream target', hiring:'Check careers page for openings in your region', hiringTone:'watch', sells:'CRM + AI agents. Buyers: sales, service, marketing leaders.', prep:'CRM fundamentals and how their AI positioning works — MEDDIC originated here.' },
  { company:'HubSpot', tier:'stretch', tierLabel:'Example · dream target', hiring:'Check careers page for openings in your region', hiringTone:'watch', sells:'CRM / marketing platform. Buyers: SMB & mid-market marketing / sales leaders.', prep:'Inbound methodology — their own framework, and their certifications are free.' },
  { company:'A local SaaS company', tier:'step', tierLabel:'Example · stepping stone', hiring:'Smaller companies often hire faster and give broader experience', hiringTone:'watch', sells:'Whatever product excites you — research who buys it and why.', prep:'Know the product, the buyer persona, and one recent piece of company news.' },
];

export const DEFAULT_GOAL_ID = 'goal_main';
export const SEED_PHASE_IDS: Record<TaskPhase, string> = { 'Phase 1': 'p1', 'Phase 2': 'p2', 'Phase 3': 'p3' };

export const DEFAULT_GOAL: Goal = {
  id: DEFAULT_GOAL_ID,
  name: 'My sales goal',
  description: 'Set your target — a quota, a new role, a skill level — and break it into phases',
  color: '#F5552E',
  phases: [
    { id: 'p1', name: 'Phase 1', description: 'Edit this goal to name your phases and set dates' },
  ],
};

export const SEED_TASKS: Task[] = [
  { id:'p1w1_1', phase:'Phase 1', week:'Getting started', priority:'High', isNew:true,
    task:'Log your first call',
    notes:'Head to Call Log and record a call — date, outcome, next step. This is what turns into your interview data story.' },
  { id:'p1w1_2', phase:'Phase 1', week:'Getting started', priority:'Medium',
    task:'Add a story to your Story Bank',
    notes:'Write up one STAR-format story (Situation, Task, Action, Result) you can reuse across interviews.' },
  { id:'p1w1_3', phase:'Phase 1', week:'Getting started', priority:'Medium',
    task:'Set your daily call goal',
    notes:'Open Profile from the sidebar and set a daily call target that fits your schedule.' },
];

export const SEED_STORIES: Story[] = [
  { id:'s1', date:'Example', title:'Turning a skeptical prospect around',
    situation:'A prospect was dismissive in the first few seconds of a cold call, assuming it was a waste of their time.',
    task:'Earn enough trust in the opening to keep them on the line and book a next step.',
    action:'Acknowledged their reaction directly, asked one specific question about their situation, then listened before pitching anything.',
    result:'Booked a follow-up call. Learned that curiosity beats a polished pitch when someone is guarded.',
    question:'Tell me about a difficult prospect · How do you handle rejection?' },
  { id:'s2', date:'Example', title:'Taking initiative without being asked',
    situation:'A repetitive manual process was slowing the team down and nobody had prioritised fixing it.',
    task:'Find a faster way to handle it without waiting for a formal project.',
    action:'Learned the tools needed, built a lightweight version myself, and rolled it into my own workflow first.',
    result:'The team adopted it within a month — proof of spotting problems and shipping solutions without being asked.',
    question:'Tell me about a time you took initiative · A time you taught yourself something' },
];

export const SEED_PREP: PrepCard[] = [
  { id:'q1', tag:'Opener', q:'Tell me about yourself.',
    a:'Lead with where you are now, connect it to why this role, and end with what you\'re doing to prepare. Keep it under 60 seconds — practice out loud until it sounds natural, not memorised.' },
  { id:'q2', tag:'Motivation', q:'Why sales?',
    a:'Get specific — what do you actually enjoy about influencing a decision or solving someone\'s problem? Avoid generic answers like "I like talking to people"; tie it to something concrete you\'ve done.' },
  { id:'q3', tag:'Company', q:'Why this company?',
    a:'Lead with the product, the buyer persona, and one recent news item or launch. Shows real research, not a copy-paste answer that could apply anywhere.' },
  { id:'q4', tag:'Objection', q:'Why hire you over someone with more experience?',
    a:'Lean into transferable proof — what have you already done that maps onto the core skills of the role, even if it wasn\'t in this exact industry?' },
  { id:'q5', tag:'Resilience', q:'How do you handle rejection?',
    a:'Talk about a system, not a feeling — how you track outcomes, what you adjust after a no, and how you keep volume up without getting discouraged.' },
  { id:'q6', tag:'Skill', q:'Walk me through a cold call.',
    a:'Opener (permission) → reason for the call → a qualifying question → ask for the meeting → handle the objection → re-ask. The goal is the next step, not the close.' },
  { id:'q7', tag:'Growth', q:'Where do you see yourself in 3–5 years?',
    a:'Show ambition with a realistic path — e.g. SDR to AE — and tie it to what the company can offer, not just what you want out of it.' },
  { id:'q8', tag:'Self-aware', q:'What\'s your biggest weakness?',
    a:'Pick something real, show you\'re aware of it, and describe the concrete habit you\'ve built to manage it. Avoid disguised humble-brags.' },
];

export const SEED_OBJECTIONS: Objection[] = [
  { id:'o1', tag:'Price', objection:'It\'s too expensive / too much money.',
    response:'I understand. Just curious — how does the current cost compare to the revenue you\'re losing right now?' },
  { id:'o2', tag:'Competitor', objection:'We already use a competitor.',
    response:'Totally fair. What made you choose them originally? I\'d love to understand what\'s working well.' },
  { id:'o3', tag:'Timing', objection:'Now\'s not a good time.',
    response:'I appreciate the honesty. When would be a better window — is it more of a budget cycle thing or a priority thing?' },
  { id:'o4', tag:'Brush off', objection:'Just send me some information.',
    response:'Happy to. So I send the most relevant stuff — what\'s the one thing you\'d most want it to answer?' },
  { id:'o5', tag:'No need', objection:'We don\'t have that problem.',
    response:'That\'s great to hear. Out of curiosity, how are you currently handling [specific thing]?' },
  { id:'o6', tag:'Decision', objection:'I\'d have to talk to my manager.',
    response:'Of course. If you were presenting this internally, what would be the first question they\'d ask?' },
  { id:'o7', tag:'Sceptical', objection:'We\'ve tried things like this before — it didn\'t work.',
    response:'That\'s a fair concern. What happened? I want to understand what went wrong so I don\'t waste your time.' },
  { id:'o8', tag:'No budget', objection:'We don\'t have budget right now.',
    response:'Understood. Is that a firm freeze, or more of a timing thing? Sometimes we can structure things around a cycle.' },
];
