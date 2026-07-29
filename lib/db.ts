import { sql } from '@vercel/postgres';
import type {
  AnalysisRow,
  AuditionRow,
  AuditionStatus,
  Beat,
  ChatMessageRow,
  GivenCircumstances,
  ScriptFormat,
  ScriptRow,
  SceneRow,
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
      await sql`CREATE INDEX IF NOT EXISTS idx_scenes_script_id ON scenes(script_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_scene_id ON chat_messages(scene_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_auditions_date ON auditions(audition_date);`;
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
  const { rows } = await sql<ScriptRow>`
    SELECT id, title, filename, format, character, source_audition_id, created_at
    FROM scripts ORDER BY created_at DESC;
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
