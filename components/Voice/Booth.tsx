'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { VoiceCharacterRow, VoiceTakeRow } from '@/lib/types';
import { blobToBase64, formatDuration, useRecorder } from '@/lib/useRecorder';

const audioUrl = (id: string) => `/api/voice/takes/${id}/audio`;

const inputClass =
  'w-full rounded border border-stage-border bg-stage-panel2 px-3 py-2 text-sm text-stage-text outline-none focus:border-stage-accent';

/**
 * The recording booth: pick a character, set up a line, record takes, and get
 * the next adjustment from an AI session director.
 *
 * The director can't hear the audio (the model only sees text) — it works from
 * the line, the voice card, the notes it has already given, and whatever the
 * actor says about the last take. The UI says so, so nobody mistakes it for
 * feedback on the actual read.
 */
export default function Booth({
  characters,
  initialCharacterId,
  initialLine = '',
  initialContext = '',
}: {
  characters: VoiceCharacterRow[];
  initialCharacterId: string | null;
  initialLine?: string;
  initialContext?: string;
}) {
  const router = useRouter();
  const recorder = useRecorder();

  const [characterId, setCharacterId] = useState<string | null>(initialCharacterId);
  const [lineText, setLineText] = useState(initialLine);
  const [context, setContext] = useState(initialContext);

  const [takes, setTakes] = useState<VoiceTakeRow[]>([]);
  const [loadingTakes, setLoadingTakes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keepersOnly, setKeepersOnly] = useState(false);

  // Director state is per-session (per line), not persisted: each note is
  // saved onto the take it produced instead.
  const [directions, setDirections] = useState<string[]>([]);
  const [actorNote, setActorNote] = useState('');
  const [directing, setDirecting] = useState(false);
  const [sessionTakeCount, setSessionTakeCount] = useState(0);

  const character = useMemo(
    () => characters.find((c) => c.id === characterId) ?? null,
    [characters, characterId]
  );
  const sampleLines = useMemo(
    () =>
      (character?.sample_lines ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [character]
  );
  const currentDirection = directions[directions.length - 1] ?? '';
  const reference = takes.find((t) => t.is_reference);
  const visibleTakes = keepersOnly ? takes.filter((t) => t.is_keeper) : takes;

  const loadTakes = useCallback(async (id: string | null) => {
    setLoadingTakes(true);
    try {
      const res = await fetch(`/api/voice/takes${id ? `?characterId=${id}` : ''}`);
      const data = await res.json();
      setTakes(data.takes ?? []);
    } catch {
      setError('Couldn’t load takes.');
    }
    setLoadingTakes(false);
  }, []);

  useEffect(() => {
    loadTakes(characterId);
  }, [characterId, loadTakes]);

  function chooseCharacter(id: string | null) {
    setCharacterId(id);
    resetSession();
    router.replace(id ? `/voice/booth?character=${id}` : '/voice/booth', { scroll: false });
  }

  function resetSession() {
    setDirections([]);
    setActorNote('');
    setSessionTakeCount(0);
  }

  function chooseLine(text: string) {
    setLineText(text);
    resetSession();
  }

  async function toggleRecording() {
    if (!recorder.isRecording) {
      setError(null);
      await recorder.start();
      return;
    }
    const recording = await recorder.stop();
    if (!recording) return;
    setSaving(true);
    try {
      const res = await fetch('/api/voice/takes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          lineText,
          direction: currentDirection,
          mimeType: recording.mimeType,
          durationMs: recording.durationMs,
          audioBase64: await blobToBase64(recording.blob),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Couldn’t save that take.');
      setTakes((prev) => [data.take, ...prev]);
      setSessionTakeCount((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  }

  async function getDirection() {
    setDirecting(true);
    setError(null);
    try {
      const res = await fetch('/api/voice/director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          lineText,
          context,
          takeNumber: sessionTakeCount,
          previousNotes: directions,
          actorNote,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'The director’s mic is off. Try again.');
      setDirections((d) => [...d, data.note]);
      setActorNote('');
    } catch (err) {
      setError((err as Error).message);
    }
    setDirecting(false);
  }

  async function patchTake(id: string, patch: { isKeeper?: boolean; isReference?: boolean }) {
    const res = await fetch(`/api/voice/takes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return setError('Couldn’t update that take.');
    const { take } = await res.json();
    setTakes((prev) =>
      prev.map((t) => {
        if (t.id === id) return take;
        // Setting a new reference clears the old one server-side; mirror it.
        if (patch.isReference) return { ...t, is_reference: false };
        return t;
      })
    );
  }

  async function deleteTake(id: string) {
    if (!window.confirm('Delete this take?')) return;
    const res = await fetch(`/api/voice/takes/${id}`, { method: 'DELETE' });
    if (res.ok) setTakes((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Setup */}
      <section className="space-y-3 rounded-lg border border-stage-border bg-stage-panel p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="booth-character" className="mb-1 block text-xs font-medium text-stage-muted">
              Character
            </label>
            <select
              id="booth-character"
              value={characterId ?? ''}
              onChange={(e) => chooseCharacter(e.target.value || null)}
              disabled={recorder.isRecording}
              className={inputClass}
            >
              <option value="">No character — scratch takes</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.project ? ` — ${c.project}` : ''}
                </option>
              ))}
            </select>
          </div>
          {character && (
            <Link
              href={`/voice/characters/${character.id}`}
              className="pb-2 text-xs text-stage-accent hover:underline"
            >
              View voice card
            </Link>
          )}
        </div>

        {character && (
          <p className="text-xs text-stage-muted">
            {[character.pitch, character.placement, character.texture, character.attitude]
              .filter((s) => s.trim())
              .join(' · ') || 'No voice details yet — fill in the card to keep this voice consistent.'}
          </p>
        )}

        {reference && (
          <div className="rounded border border-stage-border bg-stage-panel2 p-3">
            <p className="mb-1.5 text-xs font-medium text-stage-accent">
              Reference clip — match this before you record
            </p>
            <audio controls preload="none" src={audioUrl(reference.id)} className="h-9 w-full" />
            {reference.line_text && (
              <p className="mt-1 text-xs text-stage-muted">“{reference.line_text}”</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="booth-line" className="mb-1 block text-xs font-medium text-stage-muted">
            Line
          </label>
          <textarea
            id="booth-line"
            rows={2}
            value={lineText}
            onChange={(e) => setLineText(e.target.value)}
            className={inputClass}
            placeholder="Type or paste the line you're recording"
          />
          {sampleLines.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sampleLines.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => chooseLine(l)}
                  className="max-w-full truncate rounded-full border border-stage-border px-2.5 py-1 text-xs text-stage-muted hover:border-stage-accent hover:text-stage-text"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="booth-context" className="mb-1 block text-xs font-medium text-stage-muted">
            Context <span className="font-normal text-stage-subtle">(optional — what’s happening, who they’re talking to)</span>
          </label>
          <input
            id="booth-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className={inputClass}
            placeholder="e.g. Mid-battle, shouting to a teammate across the map"
          />
        </div>
      </section>

      {/* Record + direct */}
      <section className="rounded-lg border border-stage-border bg-stage-panel p-4">
        {currentDirection && (
          <div className="mb-4 rounded border-l-2 border-stage-accent bg-stage-panel2 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stage-subtle">
              Director · for take {sessionTakeCount + 1}
            </p>
            <p className="mt-0.5 text-sm text-stage-text">{currentDirection}</p>
          </div>
        )}

        {!recorder.isSupported ? (
          <p className="text-sm text-stage-muted">
            This browser can’t record audio. Try a current version of Chrome, Safari, Edge or Firefox.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={saving}
              aria-label={recorder.isRecording ? 'Stop recording' : 'Start recording'}
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 transition-colors disabled:opacity-50 ${
                recorder.isRecording
                  ? 'border-stage-danger bg-stage-danger/15'
                  : 'border-stage-border bg-stage-panel2 hover:border-stage-danger'
              }`}
            >
              <span
                className={`bg-stage-danger transition-all ${
                  recorder.isRecording ? 'h-7 w-7 rounded-sm' : 'h-10 w-10 rounded-full'
                }`}
              />
            </button>
            <p className="text-sm tabular-nums text-stage-muted" aria-live="polite">
              {saving
                ? 'Saving take…'
                : recorder.isRecording
                  ? `Recording ${formatDuration(recorder.elapsedMs)}`
                  : sessionTakeCount
                    ? `${sessionTakeCount} take${sessionTakeCount === 1 ? '' : 's'} this session`
                    : 'Tap to record'}
            </p>
            {recorder.error && <p className="text-center text-sm text-stage-danger">{recorder.error}</p>}
          </div>
        )}

        <div className="mt-4 space-y-2 border-t border-stage-border pt-4">
          <label htmlFor="booth-actor-note" className="block text-xs font-medium text-stage-muted">
            Tell the director about that take <span className="font-normal text-stage-subtle">(optional — it can’t hear you)</span>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="booth-actor-note"
              value={actorNote}
              onChange={(e) => setActorNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !directing) {
                  e.preventDefault();
                  getDirection();
                }
              }}
              className={inputClass}
              placeholder="e.g. Felt too big, lost the placement on the last word"
            />
            <button
              type="button"
              onClick={getDirection}
              disabled={directing || recorder.isRecording}
              className="shrink-0 rounded bg-stage-accent px-4 py-2 text-sm font-medium text-stage-onAccent disabled:opacity-50"
            >
              {directing ? 'Thinking…' : directions.length ? 'Next direction' : 'Get direction'}
            </button>
          </div>
          {(directions.length > 0 || sessionTakeCount > 0) && (
            <button
              type="button"
              onClick={resetSession}
              className="text-xs text-stage-subtle hover:text-stage-text"
            >
              Start a fresh session (clears directions, keeps takes)
            </button>
          )}
          {directions.length > 1 && (
            <details className="text-xs text-stage-muted">
              <summary className="cursor-pointer text-stage-subtle">
                Earlier directions ({directions.length - 1})
              </summary>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                {directions.slice(0, -1).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ol>
            </details>
          )}
        </div>
      </section>

      {error && <p className="text-sm text-stage-danger">{error}</p>}

      {/* Takes */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stage-text">
            Takes {character ? `— ${character.name}` : '— scratch'}
          </h2>
          <label className="flex items-center gap-1.5 text-xs text-stage-muted">
            <input
              type="checkbox"
              checked={keepersOnly}
              onChange={(e) => setKeepersOnly(e.target.checked)}
            />
            Keepers only
          </label>
        </div>
        {loadingTakes ? (
          <p className="text-sm text-stage-subtle">Loading…</p>
        ) : visibleTakes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stage-border px-4 py-6 text-center text-sm text-stage-subtle">
            {keepersOnly ? 'No keepers yet — star a take you like.' : 'No takes yet.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {visibleTakes.map((t) => (
              <li key={t.id} className="rounded-lg border border-stage-border bg-stage-panel p-3">
                <div className="mb-2 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stage-text">
                      {t.line_text || <span className="text-stage-subtle">(no line)</span>}
                    </p>
                    {t.direction && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-stage-muted">↳ {t.direction}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-stage-subtle">
                      {formatDuration(t.duration_ms)} ·{' '}
                      {new Date(t.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {t.is_reference && <span className="ml-1.5 text-stage-accent">· Reference</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => patchTake(t.id, { isKeeper: !t.is_keeper })}
                    aria-label={t.is_keeper ? 'Unmark keeper' : 'Mark as keeper'}
                    aria-pressed={t.is_keeper}
                    className={`text-lg leading-none ${t.is_keeper ? 'text-stage-warning' : 'text-stage-subtle hover:text-stage-warning'}`}
                  >
                    {t.is_keeper ? '★' : '☆'}
                  </button>
                </div>
                <audio controls preload="none" src={audioUrl(t.id)} className="h-9 w-full" />
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {characterId && (
                    <button
                      type="button"
                      onClick={() => patchTake(t.id, { isReference: !t.is_reference })}
                      className="text-stage-muted hover:text-stage-accent"
                    >
                      {t.is_reference ? 'Unset reference' : 'Set as reference'}
                    </button>
                  )}
                  <a href={`${audioUrl(t.id)}?download=1`} className="text-stage-muted hover:text-stage-accent">
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteTake(t.id)}
                    className="ml-auto text-stage-subtle hover:text-stage-danger"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
