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
  // Populated only by listScripts(), which joins the scene count so the
  // library can show it without a query per row.
  scene_count?: number;
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

// ---------- Voice Lab ----------

export const VOICE_MEDIUMS = ['animation', 'game', 'anime-dub', 'commercial', 'other'] as const;
export type VoiceMedium = (typeof VOICE_MEDIUMS)[number];

/**
 * The editable, descriptive fields of a voice card. Kept as one list so the
 * form, the API validation and the AI "suggest a voice" response all agree
 * on the same keys.
 */
export const VOICE_CARD_FIELDS = [
  'age',
  'pitch',
  'placement',
  'texture',
  'pace',
  'attitude',
  'voice_references',
  'physicality',
] as const;
export type VoiceCardField = (typeof VOICE_CARD_FIELDS)[number];

export interface VoiceCharacterRow extends Record<VoiceCardField, string> {
  id: string;
  name: string;
  project: string;
  medium: VoiceMedium;
  description: string;
  sample_lines: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** A recorded take, without its audio (fetched separately — it's large). */
export interface VoiceTakeRow {
  id: string;
  character_id: string | null;
  line_text: string;
  direction: string;
  mime_type: string;
  duration_ms: number;
  is_keeper: boolean;
  is_reference: boolean;
  created_at: string;
}

export const VOCAL_SESSION_KINDS = [
  'dialogue',
  'efforts',
  'screaming',
  'character-voices',
  'singing',
  'other',
] as const;
export type VocalSessionKind = (typeof VOCAL_SESSION_KINDS)[number];

export interface VocalSessionRow {
  id: string;
  // 'YYYY-MM-DD' in the user's local day, stored as text for the same reason
  // as DailyChallengeRow.challenge_date.
  session_date: string;
  kind: VocalSessionKind;
  minutes: number;
  intensity: number; // 1-5
  voice_feel: number; // 1-5, how the voice felt afterwards (5 = great)
  notes: string;
  created_at: string;
}
