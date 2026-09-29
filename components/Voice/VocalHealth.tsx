'use client';

import { useEffect, useMemo, useState } from 'react';
import { VOCAL_SESSION_KINDS, type VocalSessionKind, type VocalSessionRow } from '@/lib/types';
import { WARMUP_STEPS } from '@/lib/voice/efforts';

const KIND_LABELS: Record<VocalSessionKind, string> = {
  dialogue: 'Dialogue',
  efforts: 'Efforts',
  screaming: 'Screaming',
  'character-voices': 'Character voices',
  singing: 'Singing',
  other: 'Other',
};

const FEEL_LABELS = ['', 'Hurts / hoarse', 'Rough', 'Tired', 'Fine', 'Great'];

function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysAgo(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - then.getTime()) / 86_400_000);
}

/** A session counts as heavy if it's efforts/screaming, or rated intensity 4+. */
const isHeavy = (s: VocalSessionRow) =>
  s.kind === 'efforts' || s.kind === 'screaming' || s.intensity >= 4;

function WarmUp() {
  const [step, setStep] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (step === null || remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [step, remaining]);

  function go(i: number) {
    if (i >= WARMUP_STEPS.length) {
      setStep(null);
      return;
    }
    setStep(i);
    setRemaining(WARMUP_STEPS[i].seconds);
  }

  const totalMinutes = Math.round(WARMUP_STEPS.reduce((n, s) => n + s.seconds, 0) / 60);

  if (step === null) {
    return (
      <section className="rounded-lg border border-stage-border bg-stage-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-stage-text">Warm-up</h2>
            <p className="text-xs text-stage-muted">
              About {totalMinutes} minutes, easy to hard. Do it before any session — especially efforts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => go(0)}
            className="rounded-md bg-stage-accent px-4 py-2 text-sm font-semibold text-stage-onAccent hover:bg-stage-accentHover"
          >
            Start guided warm-up
          </button>
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stage-muted">
          {WARMUP_STEPS.map((s) => (
            <li key={s.title}>
              <span className="text-stage-text">{s.title}</span> — {s.detail}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const current = WARMUP_STEPS[step];
  return (
    <section className="rounded-lg border border-stage-accent/50 bg-stage-panel p-5 text-center">
      <p className="text-xs text-stage-muted">
        Step {step + 1} of {WARMUP_STEPS.length}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-stage-text">{current.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-stage-muted">{current.detail}</p>
      <p
        className={`mt-4 text-3xl font-semibold tabular-nums ${remaining ? 'text-stage-accent' : 'text-stage-success'}`}
        aria-live="polite"
      >
        {remaining ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : 'Done'}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setStep(null)}
          className="rounded-md border border-stage-border px-4 py-2 text-sm text-stage-muted hover:text-stage-text"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={() => go(step + 1)}
          className="rounded-md bg-stage-accent px-5 py-2 text-sm font-semibold text-stage-onAccent hover:bg-stage-accentHover"
        >
          {step + 1 === WARMUP_STEPS.length ? 'Finish' : 'Next'}
        </button>
      </div>
    </section>
  );
}

export default function VocalHealth() {
  const [sessions, setSessions] = useState<VocalSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(localDate());
  const [kind, setKind] = useState<VocalSessionKind>('dialogue');
  const [minutes, setMinutes] = useState(30);
  const [intensity, setIntensity] = useState(3);
  const [voiceFeel, setVoiceFeel] = useState(4);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch('/api/voice/sessions')
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setError('Couldn’t load your log.'))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const week = sessions.filter((s) => daysAgo(s.session_date) < 7);
    const recent = sessions.filter((s) => daysAgo(s.session_date) < 2);
    const heavyRecent = recent.filter(isHeavy).reduce((n, s) => n + s.minutes, 0);
    const latest = sessions[0];
    const warnings: string[] = [];
    if (latest && latest.voice_feel <= 2 && daysAgo(latest.session_date) < 3) {
      warnings.push(
        'Your voice felt rough after your last session. Consider a lighter day or vocal rest, and skip heavy efforts until it feels normal.'
      );
    }
    if (heavyRecent >= 60) {
      warnings.push(
        `${heavyRecent} minutes of heavy work in the last two days. That’s a lot — give your voice recovery time before more efforts or screaming.`
      );
    }
    const roughDays = new Set(
      sessions.filter((s) => s.voice_feel <= 2 && daysAgo(s.session_date) < 14).map((s) => s.session_date)
    );
    if (roughDays.size >= 4) {
      warnings.push(
        'You’ve logged a rough-feeling voice on several days in the last two weeks. Persistent hoarseness is worth getting checked by an ENT or laryngologist.'
      );
    }
    return {
      weekMinutes: week.reduce((n, s) => n + s.minutes, 0),
      weekHeavy: week.filter(isHeavy).reduce((n, s) => n + s.minutes, 0),
      weekCount: week.length,
      warnings,
    };
  }, [sessions]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/voice/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDate: date, kind, minutes, intensity, voiceFeel, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Couldn’t save.');
      setSessions((prev) =>
        [data.session, ...prev].sort((a, b) =>
          a.session_date === b.session_date
            ? b.created_at.localeCompare(a.created_at)
            : b.session_date.localeCompare(a.session_date)
        )
      );
      setNotes('');
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this log entry?')) return;
    const res = await fetch(`/api/voice/sessions/${id}`, { method: 'DELETE' });
    if (res.ok) setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  const inputClass =
    'w-full rounded border border-stage-border bg-stage-panel2 px-3 py-2 text-sm text-stage-text outline-none focus:border-stage-accent';
  const labelClass = 'mb-1 block text-xs font-medium text-stage-muted';

  return (
    <div className="space-y-6">
      <WarmUp />

      {/* Load summary */}
      <section className="grid grid-cols-3 gap-2">
        {[
          ['Sessions', summary.weekCount],
          ['Minutes', summary.weekMinutes],
          ['Heavy min.', summary.weekHeavy],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-stage-border bg-stage-panel px-3 py-2.5">
            <p className="text-lg font-semibold tabular-nums text-stage-text">{value}</p>
            <p className="text-[11px] text-stage-muted">{label} · last 7 days</p>
          </div>
        ))}
      </section>
      {summary.warnings.map((w) => (
        <p
          key={w}
          className="rounded border border-stage-warning/40 bg-stage-warning/10 px-3 py-2 text-sm text-stage-text"
        >
          {w}
        </p>
      ))}

      {/* Log form */}
      <section id="log" className="scroll-mt-20 space-y-3 rounded-lg border border-stage-border bg-stage-panel p-4">
        <h2 className="text-sm font-semibold text-stage-text">Log a session</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="vs-date">
              Date
            </label>
            <input id="vs-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="vs-kind">
              Type
            </label>
            <select
              id="vs-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as VocalSessionKind)}
              className={inputClass}
            >
              {VOCAL_SESSION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="vs-minutes">
              Minutes
            </label>
            <input
              id="vs-minutes"
              type="number"
              min={1}
              max={600}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="vs-intensity">
              Intensity: <span className="text-stage-text">{intensity}/5</span>
            </label>
            <input
              id="vs-intensity"
              type="range"
              min={1}
              max={5}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-[rgb(var(--stage-accent-rgb))]"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="vs-feel">
              Voice afterwards: <span className="text-stage-text">{FEEL_LABELS[voiceFeel]}</span>
            </label>
            <input
              id="vs-feel"
              type="range"
              min={1}
              max={5}
              value={voiceFeel}
              onChange={(e) => setVoiceFeel(Number(e.target.value))}
              className="w-full accent-[rgb(var(--stage-accent-rgb))]"
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="vs-notes">
            Notes
          </label>
          <input
            id="vs-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
            placeholder="Project, what was taxing, what helped…"
          />
        </div>
        {error && <p className="text-sm text-stage-danger">{error}</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving || !date || !minutes}
          className="rounded-md bg-stage-accent px-4 py-2 text-sm font-semibold text-stage-onAccent hover:bg-stage-accentHover disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Log session'}
        </button>
      </section>

      {/* History */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-stage-text">History</h2>
        {loading ? (
          <p className="text-sm text-stage-subtle">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-stage-subtle">Nothing logged yet.</p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-stage-border bg-stage-panel">
            {sessions.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-stage-border' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-stage-text">
                    {KIND_LABELS[s.kind]} · {s.minutes} min
                    <span className="text-stage-muted"> · intensity {s.intensity}/5</span>
                  </p>
                  <p className="truncate text-xs text-stage-muted">
                    {s.session_date} · voice: {FEEL_LABELS[s.voice_feel]}
                    {s.notes && ` · ${s.notes}`}
                  </p>
                </div>
                {isHeavy(s) && (
                  <span className="shrink-0 rounded-full bg-stage-danger/15 px-2 py-0.5 text-[11px] text-stage-danger">
                    heavy
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  aria-label="Delete entry"
                  className="shrink-0 text-xs text-stage-subtle hover:text-stage-danger"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-stage-subtle">
        These are rough guides for pacing yourself, not medical advice. If you have pain, lasting
        hoarseness, or a sudden change in your voice, see an ENT or laryngologist.
      </p>
    </div>
  );
}
