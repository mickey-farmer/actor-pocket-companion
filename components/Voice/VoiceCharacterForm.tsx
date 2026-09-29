'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  VOICE_CARD_FIELDS,
  VOICE_MEDIUMS,
  type VoiceCardField,
  type VoiceCharacterRow,
  type VoiceMedium,
} from '@/lib/types';
import { CARD_FIELD_META, MEDIUM_LABELS } from '@/lib/voice/labels';

type FormState = {
  name: string;
  project: string;
  medium: VoiceMedium;
  description: string;
  sample_lines: string;
  notes: string;
} & Record<VoiceCardField, string>;

function initialState(c?: VoiceCharacterRow): FormState {
  const base = {
    name: c?.name ?? '',
    project: c?.project ?? '',
    medium: c?.medium ?? 'animation',
    description: c?.description ?? '',
    sample_lines: c?.sample_lines ?? '',
    notes: c?.notes ?? '',
  };
  const card = Object.fromEntries(VOICE_CARD_FIELDS.map((f) => [f, c?.[f] ?? ''])) as Record<
    VoiceCardField,
    string
  >;
  return { ...base, ...card };
}

const inputClass =
  'w-full rounded border border-stage-border bg-stage-panel2 px-3 py-2 text-sm text-stage-text outline-none focus:border-stage-accent';
const labelClass = 'mb-1 block text-xs font-medium text-stage-muted';

export default function VoiceCharacterForm({ character }: { character?: VoiceCharacterRow }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(character));
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const hasCardContent = VOICE_CARD_FIELDS.some((f) => form[f].trim());

  async function suggest() {
    if (!form.name.trim()) {
      setError('Give the character a name first.');
      return;
    }
    if (hasCardContent && !window.confirm('Replace the current voice details with a suggestion?')) {
      return;
    }
    setError(null);
    setSuggesting(true);
    try {
      const res = await fetch('/api/voice/characters/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          project: form.project,
          medium: form.medium,
          description: form.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Couldn’t get a suggestion.');
      setForm((f) => ({ ...f, ...data.suggestion }));
    } catch (err) {
      setError((err as Error).message);
    }
    setSuggesting(false);
  }

  async function save() {
    if (!form.name.trim()) {
      setError('Give the character a name.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        character ? `/api/voice/characters/${character.id}` : '/api/voice/characters',
        {
          method: character ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Couldn’t save.');
      if (character) {
        setSavedAt(Date.now());
        router.refresh();
      } else {
        router.push(`/voice/characters/${data.character.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  }

  async function remove() {
    if (!character) return;
    if (!window.confirm(`Delete ${character.name} and all of their recorded takes?`)) return;
    await fetch(`/api/voice/characters/${character.id}`, { method: 'DELETE' });
    router.push('/voice');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-lg border border-stage-border bg-stage-panel p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="vc-name">
              Character name
            </label>
            <input
              id="vc-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputClass}
              placeholder="e.g. Pip the Gremlin"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="vc-project">
              Project
            </label>
            <input
              id="vc-project"
              value={form.project}
              onChange={(e) => set('project', e.target.value)}
              className={inputClass}
              placeholder="Show, game, or audition"
            />
          </div>
        </div>
        <div>
          <span className={labelClass}>Medium</span>
          <div className="flex flex-wrap gap-2">
            {VOICE_MEDIUMS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set('medium', m)}
                aria-pressed={form.medium === m}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  form.medium === m
                    ? 'border-stage-accent bg-stage-accent/15 text-stage-accent'
                    : 'border-stage-border text-stage-muted hover:text-stage-text'
                }`}
              >
                {MEDIUM_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="vc-desc">
            Breakdown / description
          </label>
          <textarea
            id="vc-desc"
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className={inputClass}
            placeholder="Paste the casting breakdown, or describe who they are."
          />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-stage-border bg-stage-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-stage-text">The voice</h2>
            <p className="text-xs text-stage-muted">
              Enough detail to find it again cold, months from now.
            </p>
          </div>
          <button
            type="button"
            onClick={suggest}
            disabled={suggesting}
            className="rounded border border-stage-border px-3 py-1.5 text-xs font-medium text-stage-muted transition-colors hover:border-stage-accent hover:text-stage-accent disabled:opacity-50"
          >
            {suggesting ? 'Thinking…' : '✦ Suggest a voice'}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {VOICE_CARD_FIELDS.map((f) => (
            <div key={f}>
              <label className={labelClass} htmlFor={`vc-${f}`}>
                {CARD_FIELD_META[f].label}
              </label>
              <textarea
                id={`vc-${f}`}
                rows={2}
                value={form[f]}
                onChange={(e) => set(f, e.target.value)}
                className={inputClass}
                placeholder={CARD_FIELD_META[f].hint}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-stage-border bg-stage-panel p-4">
        <div>
          <label className={labelClass} htmlFor="vc-lines">
            Sample lines <span className="font-normal text-stage-subtle">(one per line — quick-pick these in the Booth)</span>
          </label>
          <textarea
            id="vc-lines"
            rows={4}
            value={form.sample_lines}
            onChange={(e) => set('sample_lines', e.target.value)}
            className={inputClass}
            placeholder={'You’ll never catch me!\nHeh… that tickles.'}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="vc-notes">
            Notes
          </label>
          <textarea
            id="vc-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className={inputClass}
            placeholder="Director feedback, warm-up that works for this voice, what to avoid…"
          />
        </div>
      </section>

      {error && <p className="text-sm text-stage-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-stage-accent px-4 py-2 text-sm font-semibold text-stage-onAccent transition-colors hover:bg-stage-accentHover disabled:opacity-50"
        >
          {saving ? 'Saving…' : character ? 'Save changes' : 'Create voice card'}
        </button>
        {savedAt && !saving && <span className="text-xs text-stage-success">Saved</span>}
        {character && (
          <button
            type="button"
            onClick={remove}
            className="ml-auto text-xs text-stage-subtle hover:text-stage-danger"
          >
            Delete character
          </button>
        )}
      </div>
    </div>
  );
}
