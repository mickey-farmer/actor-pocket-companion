import { sql } from '@vercel/postgres';
import type {
  AnalysisRow,
  AuditionRow,
  AuditionStatus,
  Beat,
  ChatMessageRow,
  DailyChallengeRow,
  GivenCircumstances,
  ScriptFormat,
  ScriptRow,
  SceneRow,
  VocalSessionKind,
  VocalSessionRow,
  VoiceCharacterRow,
  VoiceMedium,
  VoiceTakeRow,
} from './types';

let schemaReady: Promise<void> | null = null;

/** Creates all tables if they don't already exist. Safe to call repeatedly. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS scripts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          filename TEXT NOT NULL,
          format TEXT NOT NULL,
          raw_text TEXT NOT NULL,
          character TEXT,
          source_audition_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS scenes (
          id TEXT PRIMARY KEY,
          script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
          scene_index INTEGER NOT NULL,
          heading TEXT NOT NULL,
          content TEXT NOT NULL,
          characters JSONB NOT NULL DEFAULT '[]',
          notes TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      // Migration for databases created before the notes column existed.
      await sql`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';`;
      // Migration for databases created before source_audition_id existed.
      // No FK constraint here on purpose — the auditions table doesn't
      // necessarily exist yet at this point for a fresh database, and this
      // is a soft, purely-informational link (drives the "Audition" pill).
      await sql`ALTER TABLE scripts ADD COLUMN IF NOT EXISTS source_audition_id TEXT;`;
      await sql`
        CREATE TABLE IF NOT EXISTS analyses (
          id TEXT PRIMARY KEY,
          scene_id TEXT NOT NULL UNIQUE REFERENCES scenes(id) ON DELETE CASCADE,
          story_summary TEXT NOT NULL,
          character_fit TEXT NOT NULL,
          moment_before TEXT NOT NULL,
          given_circumstances JSONB NOT NULL,
          beats JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS auditions (
          id TEXT PRIMARY KEY,
          project TEXT NOT NULL,
          role TEXT,
          audition_date TIMESTAMPTZ,
          location TEXT,
          casting_director TEXT,
          status TEXT NOT NULL DEFAULT 'upcoming',
          notes TEXT NOT NULL DEFAULT '',
          script_id TEXT REFERENCES scripts(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS daily_challenges (
          id TEXT PRIMARY KEY,
          challenge_date TEXT NOT NULL,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          prompt_text TEXT NOT NULL,
          duration_minutes INTEGER,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      // Conversations with the coach that aren't tied to one scene: the
      // general chat (script_id NULL) and whole-script chats. Scene chats
      // keep living in chat_messages.
      await sql`
        CREATE TABLE IF NOT EXISTS coach_messages (
          id TEXT PRIMARY KEY,
          script_id TEXT REFERENCES scripts(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_coach_messages_script_id ON coach_messages(script_id);`;
      // ---------- Voice Lab ----------
      await sql`
        CREATE TABLE IF NOT EXISTS voice_characters (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          project TEXT NOT NULL DEFAULT '',
          medium TEXT NOT NULL DEFAULT 'animation',
          description TEXT NOT NULL DEFAULT '',
          age TEXT NOT NULL DEFAULT '',
          pitch TEXT NOT NULL DEFAULT '',
          placement TEXT NOT NULL DEFAULT '',
          texture TEXT NOT NULL DEFAULT '',
          pace TEXT NOT NULL DEFAULT '',
          attitude TEXT NOT NULL DEFAULT '',
          voice_references TEXT NOT NULL DEFAULT '',
          physicality TEXT NOT NULL DEFAULT '',
          sample_lines TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      // Audio is stored base64-encoded in a TEXT column: clips are small
      // (a few hundred KB of Opus), and it sidesteps binary-parameter
      // handling differences in the serverless Postgres driver.
      await sql`
        CREATE TABLE IF NOT EXISTS voice_takes (
          id TEXT PRIMARY KEY,
          character_id TEXT REFERENCES voice_characters(id) ON DELETE CASCADE,
          line_text TEXT NOT NULL DEFAULT '',
          direction TEXT NOT NULL DEFAULT '',
          mime_type TEXT NOT NULL,
          duration_ms INTEGER NOT NULL DEFAULT 0,
          audio_base64 TEXT NOT NULL,
          is_keeper BOOLEAN NOT NULL DEFAULT false,
          is_reference BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_voice_takes_character_id ON voice_takes(character_id);`;
      await sql`
        CREATE TABLE IF NOT EXISTS vocal_sessions (
          id TEXT PRIMARY KEY,
          session_date TEXT NOT NULL,
          kind TEXT NOT NULL,
          minutes INTEGER NOT NULL,
          intensity INTEGER NOT NULL,
          voice_feel INTEGER NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_vocal_sessions_date ON vocal_sessions(session_date);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_scenes_script_id ON scenes(script_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_scene_id ON chat_messages(scene_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_auditions_date ON auditions(audition_date);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);`;
    })();
  }
  return schemaReady;
}

function newId(): string {
  return crypto.randomUUID();
}

// ---------- Scripts ----------

export async function createScript(input: {
  title: string;
  filename: string;
  format: ScriptFormat;
  rawText: string;
}): Promise<string> {
  await ensureSchema();
  const id = newId();
  await sql`
    INSERT INTO scripts (id, title, filename, format, raw_text)
    VALUES (${id}, ${input.title}, ${input.filename}, ${input.format}, ${input.rawText});
  `;
  return id;
}

export async function listScripts(): Promise<ScriptRow[]> {
  await ensureSchema();
  // Joins the scene count so the library list can show it without firing a
  // query per row.
  const { rows } = await sql<ScriptRow>`
    SELECT s.id, s.title, s.filename, s.format, s.character,
           s.source_audition_id, s.created_at,
           COUNT(sc.id)::int AS scene_count
    FROM scripts s
    LEFT JOIN scenes sc ON sc.script_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC;
  `;
  return rows as ScriptRow[];
}

/**
 * Tags a script as having been uploaded through the "Upload new" path in
 * the audition form, so the Scripts library can show an "Audition" pill.
 * Only ever called right after a fresh upload — picking an already-existing
 * script as sides does not call this.
 */
export async function setScriptSourceAudition(
  scriptId: string,
  auditionId: string
): Promise<void> {
  await ensureSchema();
  await sql`UPDATE scripts SET source_audition_id = ${auditionId} WHERE id = ${scriptId};`;
}

export async function getScript(id: string): Promise<ScriptRow | null> {
  await ensureSchema();
  const { rows } = await sql<ScriptRow>`SELECT * FROM scripts WHERE id = ${id};`;
  return (rows[0] as ScriptRow) ?? null;
}

export async function setScriptCharacter(id: string, character: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE scripts SET character = ${character} WHERE id = ${id};`;
}

export async function deleteScript(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM scripts WHERE id = ${id};`;
}

// ---------- Scenes ----------

export async function createScene(input: {
  scriptId: string;
  sceneIndex: number;
  heading: string;
  content: string;
  characters: string[];
}): Promise<string> {
  await ensureSchema();
  const id = newId();
  await sql`
    INSERT INTO scenes (id, script_id, scene_index, heading, content, characters)
    VALUES (${id}, ${input.scriptId}, ${input.sceneIndex}, ${input.heading}, ${input.content}, ${JSON.stringify(input.characters)}::jsonb);
  `;
  return id;
}

export async function listScenes(scriptId: string): Promise<SceneRow[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT * FROM scenes WHERE script_id = ${scriptId} ORDER BY scene_index ASC;
  `;
  return rows.map(normalizeScene);
}

export async function getScene(id: string): Promise<SceneRow | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM scenes WHERE id = ${id};`;
  if (!rows[0]) return null;
  return normalizeScene(rows[0]);
}

export async function updateSceneNotes(id: string, notes: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE scenes SET notes = ${notes} WHERE id = ${id};`;
}

function normalizeScene(row: any): SceneRow {
  return {
    ...row,
    characters: Array.isArray(row.characters)
      ? row.characters
      : JSON.parse(row.characters ?? '[]'),
  };
}

// ---------- Analyses ----------

export async function upsertAnalysis(input: {
  sceneId: string;
  storySummary: string;
  characterFit: string;
  momentBefore: string;
  givenCircumstances: GivenCircumstances;
  beats: Beat[];
}): Promise<AnalysisRow> {
  await ensureSchema();
  const id = newId();
  const { rows } = await sql`
    INSERT INTO analyses (id, scene_id, story_summary, character_fit, moment_before, given_circumstances, beats)
    VALUES (
      ${id}, ${input.sceneId}, ${input.storySummary}, ${input.characterFit}, ${input.momentBefore},
      ${JSON.stringify(input.givenCircumstances)}::jsonb, ${JSON.stringify(input.beats)}::jsonb
    )
    ON CONFLICT (scene_id) DO UPDATE SET
      story_summary = EXCLUDED.story_summary,
      character_fit = EXCLUDED.character_fit,
      moment_before = EXCLUDED.moment_before,
      given_circumstances = EXCLUDED.given_circumstances,
      beats = EXCLUDED.beats
    RETURNING *;
  `;
  return normalizeAnalysis(rows[0]);
}

export async function getAnalysis(sceneId: string): Promise<AnalysisRow | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM analyses WHERE scene_id = ${sceneId};`;
  if (!rows[0]) return null;
  return normalizeAnalysis(rows[0]);
}

function normalizeAnalysis(row: any): AnalysisRow {
  return {
    ...row,
    given_circumstances:
      typeof row.given_circumstances === 'string'
        ? JSON.parse(row.given_circumstances)
        : row.given_circumstances,
    beats: typeof row.beats === 'string' ? JSON.parse(row.beats) : row.beats,
  };
}

// ---------- Chat ----------

export async function addChatMessage(input: {
  sceneId: string;
  role: 'user' | 'assistant';
  content: string;
}): Promise<ChatMessageRow> {
  await ensureSchema();
  const id = newId();
  const { rows } = await sql`
    INSERT INTO chat_messages (id, scene_id, role, content)
    VALUES (${id}, ${input.sceneId}, ${input.role}, ${input.content})
    RETURNING *;
  `;
  return rows[0] as ChatMessageRow;
}

export async function listChatMessages(sceneId: string): Promise<ChatMessageRow[]> {
  await ensureSchema();
  const { rows } = await sql<ChatMessageRow>`
    SELECT * FROM chat_messages WHERE scene_id = ${sceneId} ORDER BY created_at ASC;
  `;
  return rows as ChatMessageRow[];
}

export async function clearChatMessages(sceneId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM chat_messages WHERE scene_id = ${sceneId};`;
}

// ---------- Coach chat (general + whole-script) ----------

/** `scriptId` null means the general, not-about-any-script conversation. */
export async function addCoachMessage(input: {
  scriptId: string | null;
  role: 'user' | 'assistant';
  content: string;
}): Promise<ChatMessageRow> {
  await ensureSchema();
  const id = newId();
  const { rows } = await sql`
    INSERT INTO coach_messages (id, script_id, role, content)
    VALUES (${id}, ${input.scriptId}, ${input.role}, ${input.content})
    RETURNING *;
  `;
  return rows[0] as ChatMessageRow;
}

export async function listCoachMessages(scriptId: string | null): Promise<ChatMessageRow[]> {
  await ensureSchema();
  const { rows } = scriptId
    ? await sql`SELECT * FROM coach_messages WHERE script_id = ${scriptId} ORDER BY created_at ASC;`
    : await sql`SELECT * FROM coach_messages WHERE script_id IS NULL ORDER BY created_at ASC;`;
  return rows as ChatMessageRow[];
}

export async function clearCoachMessages(scriptId: string | null): Promise<void> {
  await ensureSchema();
  if (scriptId) {
    await sql`DELETE FROM coach_messages WHERE script_id = ${scriptId};`;
  } else {
    await sql`DELETE FROM coach_messages WHERE script_id IS NULL;`;
  }
}

// ---------- Auditions ----------

export async function createAudition(input: {
  project: string;
  role?: string | null;
  auditionDate?: string | null;
  location?: string | null;
  castingDirector?: string | null;
  status?: AuditionStatus;
  notes?: string;
  scriptId?: string | null;
}): Promise<string> {
  await ensureSchema();
  const id = newId();
  await sql`
    INSERT INTO auditions (
      id, project, role, audition_date, location, casting_director, status, notes, script_id
    )
    VALUES (
      ${id}, ${input.project}, ${input.role ?? null}, ${input.auditionDate ?? null},
      ${input.location ?? null}, ${input.castingDirector ?? null}, ${input.status ?? 'upcoming'},
      ${input.notes ?? ''}, ${input.scriptId ?? null}
    );
  `;
  return id;
}

export async function listAuditions(): Promise<AuditionRow[]> {
  await ensureSchema();
  const { rows } = await sql<AuditionRow>`
    SELECT * FROM auditions ORDER BY audition_date ASC NULLS LAST, created_at DESC;
  `;
  return rows as AuditionRow[];
}

export async function getAudition(id: string): Promise<AuditionRow | null> {
  await ensureSchema();
  const { rows } = await sql<AuditionRow>`SELECT * FROM auditions WHERE id = ${id};`;
  return (rows[0] as AuditionRow) ?? null;
}

export async function updateAudition(
  id: string,
  input: {
    project?: string;
    role?: string | null;
    auditionDate?: string | null;
    location?: string | null;
    castingDirector?: string | null;
    status?: AuditionStatus;
    notes?: string;
    scriptId?: string | null;
  }
): Promise<AuditionRow | null> {
  await ensureSchema();
  const existing = await getAudition(id);
  if (!existing) return null;

  const merged = {
    project: input.project ?? existing.project,
    role: input.role !== undefined ? input.role : existing.role,
    auditionDate: input.auditionDate !== undefined ? input.auditionDate : existing.audition_date,
    location: input.location !== undefined ? input.location : existing.location,
    castingDirector:
      input.castingDirector !== undefined ? input.castingDirector : existing.casting_director,
    status: input.status ?? existing.status,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    scriptId: input.scriptId !== undefined ? input.scriptId : existing.script_id,
  };

  const { rows } = await sql<AuditionRow>`
    UPDATE auditions SET
      project = ${merged.project},
      role = ${merged.role},
      audition_date = ${merged.auditionDate},
      location = ${merged.location},
      casting_director = ${merged.castingDirector},
      status = ${merged.status},
      notes = ${merged.notes},
      script_id = ${merged.scriptId}
    WHERE id = ${id}
    RETURNING *;
  `;
  return (rows[0] as AuditionRow) ?? null;
}

export async function deleteAudition(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM auditions WHERE id = ${id};`;
}

// ---------- Daily Challenges ----------

export async function createDailyChallenge(input: {
  challengeDate: string;
  category: string;
  title: string;
  promptText: string;
  durationMinutes?: number | null;
}): Promise<string> {
  await ensureSchema();
  const id = newId();
  await sql`
    INSERT INTO daily_challenges (id, challenge_date, category, title, prompt_text, duration_minutes)
    VALUES (
      ${id}, ${input.challengeDate}, ${input.category}, ${input.title},
      ${input.promptText}, ${input.durationMinutes ?? null}
    );
  `;
  return id;
}

export async function getDailyChallenge(id: string): Promise<DailyChallengeRow | null> {
  await ensureSchema();
  const { rows } = await sql<DailyChallengeRow>`
    SELECT * FROM daily_challenges WHERE id = ${id};
  `;
  return (rows[0] as DailyChallengeRow) ?? null;
}

/** The most recently generated challenge for a given 'YYYY-MM-DD' date, if any. */
export async function getLatestChallengeForDate(
  date: string
): Promise<DailyChallengeRow | null> {
  await ensureSchema();
  const { rows } = await sql<DailyChallengeRow>`
    SELECT * FROM daily_challenges
    WHERE challenge_date = ${date}
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  return (rows[0] as DailyChallengeRow) ?? null;
}

/**
 * One row per distinct date (whichever was generated most recently for
 * that date, i.e. the one a manual refresh replaced with), most recent
 * dates first. Used for both the history list and streak calculation.
 */
export async function listRecentChallenges(limit = 14): Promise<DailyChallengeRow[]> {
  await ensureSchema();
  const { rows } = await sql<DailyChallengeRow>`
    SELECT DISTINCT ON (challenge_date) *
    FROM daily_challenges
    ORDER BY challenge_date DESC, created_at DESC
    LIMIT ${limit};
  `;
  return rows as DailyChallengeRow[];
}

/** Idempotent — completing an already-completed challenge just returns it unchanged. */
export async function completeDailyChallenge(
  id: string
): Promise<DailyChallengeRow | null> {
  await ensureSchema();
  const { rows } = await sql<DailyChallengeRow>`
    UPDATE daily_challenges SET completed_at = now()
    WHERE id = ${id} AND completed_at IS NULL
    RETURNING *;
  `;
  if (rows[0]) return rows[0] as DailyChallengeRow;
  return getDailyChallenge(id);
}

// ---------- Voice Lab: characters ----------

export interface VoiceCharacterInput {
  name?: string;
  project?: string;
  medium?: VoiceMedium;
  description?: string;
  age?: string;
  pitch?: string;
  placement?: string;
  texture?: string;
  pace?: string;
  attitude?: string;
  voice_references?: string;
  physicality?: string;
  sample_lines?: string;
  notes?: string;
}

export async function listVoiceCharacters(): Promise<VoiceCharacterRow[]> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM voice_characters ORDER BY updated_at DESC;`;
  return rows as VoiceCharacterRow[];
}

export async function getVoiceCharacter(id: string): Promise<VoiceCharacterRow | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM voice_characters WHERE id = ${id};`;
  return (rows[0] as VoiceCharacterRow) ?? null;
}

export async function createVoiceCharacter(
  input: VoiceCharacterInput & { name: string }
): Promise<VoiceCharacterRow> {
  await ensureSchema();
  const id = newId();
  await sql`INSERT INTO voice_characters (id, name) VALUES (${id}, ${input.name});`;
  return (await updateVoiceCharacter(id, input)) as VoiceCharacterRow;
}

export async function updateVoiceCharacter(
  id: string,
  input: VoiceCharacterInput
): Promise<VoiceCharacterRow | null> {
  await ensureSchema();
  const existing = await getVoiceCharacter(id);
  if (!existing) return null;
  const m = { ...existing, ...stripUndefined(input) };

  const { rows } = await sql`
    UPDATE voice_characters SET
      name = ${m.name},
      project = ${m.project},
      medium = ${m.medium},
      description = ${m.description},
      age = ${m.age},
      pitch = ${m.pitch},
      placement = ${m.placement},
      texture = ${m.texture},
      pace = ${m.pace},
      attitude = ${m.attitude},
      voice_references = ${m.voice_references},
      physicality = ${m.physicality},
      sample_lines = ${m.sample_lines},
      notes = ${m.notes},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *;
  `;
  return (rows[0] as VoiceCharacterRow) ?? null;
}

export async function deleteVoiceCharacter(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM voice_characters WHERE id = ${id};`;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

// ---------- Voice Lab: takes ----------

// Every column except the audio itself, for listings.
const TAKE_COLUMNS_SQL = `id, character_id, line_text, direction, mime_type, duration_ms,
  is_keeper, is_reference, created_at`;

/** `characterId` null lists "scratch" takes that aren't tied to a character. */
export async function listVoiceTakes(characterId: string | null): Promise<VoiceTakeRow[]> {
  await ensureSchema();
  const { rows } = characterId
    ? await sql.query(
        `SELECT ${TAKE_COLUMNS_SQL} FROM voice_takes WHERE character_id = $1 ORDER BY created_at DESC;`,
        [characterId]
      )
    : await sql.query(
        `SELECT ${TAKE_COLUMNS_SQL} FROM voice_takes WHERE character_id IS NULL ORDER BY created_at DESC;`
      );
  return rows as VoiceTakeRow[];
}

export async function createVoiceTake(input: {
  characterId: string | null;
  lineText: string;
  direction: string;
  mimeType: string;
  durationMs: number;
  audioBase64: string;
}): Promise<VoiceTakeRow> {
  await ensureSchema();
  const id = newId();
  await sql`
    INSERT INTO voice_takes (id, character_id, line_text, direction, mime_type, duration_ms, audio_base64)
    VALUES (${id}, ${input.characterId}, ${input.lineText}, ${input.direction},
            ${input.mimeType}, ${input.durationMs}, ${input.audioBase64});
  `;
  return (await getVoiceTake(id)) as VoiceTakeRow;
}

export async function getVoiceTake(id: string): Promise<VoiceTakeRow | null> {
  await ensureSchema();
  const { rows } = await sql.query(`SELECT ${TAKE_COLUMNS_SQL} FROM voice_takes WHERE id = $1;`, [
    id,
  ]);
  return (rows[0] as VoiceTakeRow) ?? null;
}

export async function getVoiceTakeAudio(
  id: string
): Promise<{ mime_type: string; audio_base64: string; line_text: string; created_at: string } | null> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT mime_type, audio_base64, line_text, created_at FROM voice_takes WHERE id = ${id};
  `;
  return (rows[0] as { mime_type: string; audio_base64: string; line_text: string; created_at: string }) ?? null;
}

export async function updateVoiceTake(
  id: string,
  input: { isKeeper?: boolean; isReference?: boolean }
): Promise<VoiceTakeRow | null> {
  await ensureSchema();
  const take = await getVoiceTake(id);
  if (!take) return null;
  if (input.isKeeper !== undefined) {
    await sql`UPDATE voice_takes SET is_keeper = ${input.isKeeper} WHERE id = ${id};`;
  }
  if (input.isReference !== undefined) {
    // Only one reference clip per character: it's "the" voice to match.
    if (input.isReference && take.character_id) {
      await sql`UPDATE voice_takes SET is_reference = false WHERE character_id = ${take.character_id};`;
    }
    await sql`UPDATE voice_takes SET is_reference = ${input.isReference} WHERE id = ${id};`;
  }
  return getVoiceTake(id);
}

export async function deleteVoiceTake(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM voice_takes WHERE id = ${id};`;
}

// ---------- Voice Lab: vocal health log ----------

export async function listVocalSessions(limit = 60): Promise<VocalSessionRow[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT * FROM vocal_sessions ORDER BY session_date DESC, created_at DESC LIMIT ${limit};
  `;
  return rows as VocalSessionRow[];
}

export async function createVocalSession(input: {
  sessionDate: string;
  kind: VocalSessionKind;
  minutes: number;
  intensity: number;
  voiceFeel: number;
  notes: string;
}): Promise<VocalSessionRow> {
  await ensureSchema();
  const id = newId();
  const { rows } = await sql`
    INSERT INTO vocal_sessions (id, session_date, kind, minutes, intensity, voice_feel, notes)
    VALUES (${id}, ${input.sessionDate}, ${input.kind}, ${input.minutes}, ${input.intensity},
            ${input.voiceFeel}, ${input.notes})
    RETURNING *;
  `;
  return rows[0] as VocalSessionRow;
}

export async function deleteVocalSession(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM vocal_sessions WHERE id = ${id};`;
}
