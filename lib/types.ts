export type ScriptFormat = 'pdf' | 'txt' | 'docx' | 'fdx';

export interface ScriptRow {
  id: string;
  title: string;
  filename: string;
  format: ScriptFormat;
  raw_text: string;
  character: string | null;
  // Set only when this script was uploaded through the "Upload new" path in
  // the audition form — not when an already-existing script is merely
  // selected as sides for an audition. Drives the "Audition" pill in the
  // Scripts library.
  source_audition_id: string | null;
  created_at: string;
}

export interface SceneRow {
  id: string;
  script_id: string;
  scene_index: number;
  heading: string;
  content: string;
  characters: string[];
  notes: string;
  created_at: string;
}

export interface GivenCircumstances {
  who: string;
  what: string;
  where: string;
  when: string;
  why: string;
}

export interface Beat {
  beatNumber: number;
  description: string;
  intentionShift: string;
}

export interface AnalysisRow {
  id: string;
  scene_id: string;
  story_summary: string;
  character_fit: string;
  moment_before: string;
  given_circumstances: GivenCircumstances;
  beats: Beat[];
  created_at: string;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessageRow {
  id: string;
  scene_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface ScriptLine {
  speaker: string | null; // null for action/stage direction lines
  text: string;
  isCharacterLine: boolean; // true if speaker matches the actor's chosen character
}

export type AuditionStatus = 'upcoming' | 'submitted' | 'callback' | 'booked' | 'passed';

export interface AuditionRow {
  id: string;
  project: string;
  role: string | null;
  audition_date: string | null;
  location: string | null;
  casting_director: string | null;
  status: AuditionStatus;
  notes: string;
  script_id: string | null;
  created_at: string;
}

// A general craft-exercise pool, not tied to any category enum at the DB
// level (the AI reports whichever category fits, as free text) — this list
// is just what we hint it toward when generating.
export const CHALLENGE_CATEGORIES = [
  'vocal',
  'physical',
  'emotional-recall',
  'improv',
  'cold-read',
  'observation',
  'imagination',
] as const;

export type ChallengeCategory = (typeof CHALLENGE_CATEGORIES)[number];

export interface DailyChallengeRow {
  id: string;
  // 'YYYY-MM-DD', UTC. Which calendar day this challenge belongs to —
  // stored as plain text rather than a real DATE column to avoid
  // timezone-parsing surprises from the Postgres driver.
  challenge_date: string;
  category: string;
  title: string;
  prompt_text: string;
  duration_minutes: number | null;
  completed_at: string | null;
  created_at: string;
}
