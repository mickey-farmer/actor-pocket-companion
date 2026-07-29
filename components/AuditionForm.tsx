'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuditionRow, AuditionStatus, ScriptRow } from '@/lib/types';
import { toIsoFromLocalInput, toLocalDatetimeInputValue } from '@/lib/dateInput';
import UploadForm from '@/components/UploadForm';

const STATUS_OPTIONS: { value: AuditionStatus; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'callback', label: 'Callback' },
  { value: 'booked', label: 'Booked' },
  { value: 'passed', label: 'Passed' },
];

const inputClass =
  'w-full rounded border border-stage-border bg-black/20 px-3 py-2 text-slate-100 outline-none focus:border-stage-accent';

export default function AuditionForm({ existing }: { existing?: AuditionRow }) {
  const router = useRouter();
  const [scripts, setScripts] = useState<ScriptRow[]>([]);
  const [project, setProject] = useState(existing?.project ?? '');
  const [role, setRole] = useState(existing?.role ?? '');
  const [dateValue, setDateValue] = useState(
    toLocalDatetimeInputValue(existing?.audition_date)
  );
  const [location, setLocation] = useState(existing?.location ?? '');
  const [castingDirector, setCastingDirector] = useState(existing?.casting_director ?? '');
  const [status, setStatus] = useState<AuditionStatus>(existing?.status ?? 'upcoming');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [scriptId, setScriptId] = useState<string>(existing?.script_id ?? '');
  // True only when the attached script was uploaded fresh through the
  // "Upload new" button below — not when an already-existing script was
  // picked. Drives the "Audition" pill on the Scripts library page.
  const [attachedAsNewSide, setAttachedAsNewSide] = useState(false);
  const [sidesMode, setSidesMode] = useState<'closed' | 'existing' | 'upload'>('closed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((d) => {
        const list: ScriptRow[] = d.scripts ?? [];
        setScripts(list);
        if (existing?.script_id) {
          const attached = list.find((s) => s.id === existing.script_id);
          if (attached?.source_audition_id === existing.id) setAttachedAsNewSide(true);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attachedScript = scripts.find((s) => s.id === scriptId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project.trim()) {
      setError('Project name required');
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      project: project.trim(),
      role: role.trim() || null,
      auditionDate: toIsoFromLocalInput(dateValue),
      location: location.trim() || null,
      castingDirector: castingDirector.trim() || null,
      status,
      notes,
      scriptId: scriptId || null,
      attachedAsNewSide,
    };

    try {
      const url = existing ? `/api/auditions/${existing.id}` : '/api/auditions';
      const method = existing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Could not save.');
        setLoading(false);
        return;
      }
      const id = existing ? existing.id : data.auditionId;
      router.push(`/auditions/${id}`);
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-stage-border bg-stage-panel p-5"
    >
      <Field label="Project / show" required>
        <input
          value={project}
          onChange={(e) => setProject(e.target.value)}
          placeholder="e.g. Cold Case S3"
          className={inputClass}
        />
      </Field>
      <Field label="Role">
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Detective Reyes"
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date & time">
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AuditionStatus)}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Location">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Self-tape, studio address, Zoom link…"
          className={inputClass}
        />
      </Field>
      <Field label="Casting director / office">
        <input
          value={castingDirector}
          onChange={(e) => setCastingDirector(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Attach sides (optional)">
        {scriptId ? (
          <div className="flex items-center justify-between gap-2 rounded border border-stage-border bg-black/20 px-3 py-2 text-sm">
            <div className="min-w-0 truncate">
              {attachedScript?.title ?? 'Attached script'}
              {attachedAsNewSide && (
                <span className="ml-2 rounded-full bg-stage-accent/20 px-2 py-0.5 text-[11px] font-medium text-stage-accent">
                  New upload
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setScriptId('');
                setAttachedAsNewSide(false);
                setSidesMode('closed');
              }}
              className="shrink-0 text-xs text-red-400 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : sidesMode === 'closed' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSidesMode('existing')}
              className="flex-1 rounded border border-stage-border px-3 py-2 text-sm text-slate-300 hover:border-stage-accent hover:text-stage-accent"
            >
              Choose existing script
            </button>
            <button
              type="button"
              onClick={() => setSidesMode('upload')}
              className="flex-1 rounded border border-stage-border px-3 py-2 text-sm text-slate-300 hover:border-stage-accent hover:text-stage-accent"
            >
              Upload new
            </button>
          </div>
        ) : sidesMode === 'existing' ? (
          <div className="space-y-2">
            <select
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                setScriptId(e.target.value);
                setAttachedAsNewSide(false);
                setSidesMode('closed');
              }}
              className={inputClass}
            >
              <option value="">Select a script…</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSidesMode('closed')}
              className="text-xs text-slate-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-2 rounded border border-stage-border bg-black/10 p-3">
            <UploadForm
              compact
              onUploaded={(id) => {
                setScriptId(id);
                setAttachedAsNewSide(true);
                setSidesMode('closed');
              }}
            />
            <button
              type="button"
              onClick={() => setSidesMode('closed')}
              className="text-xs text-slate-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </Field>
      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className={inputClass}
        />
      </Field>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-stage-accent px-4 py-2 font-medium text-stage-onAccent disabled:opacity-50"
      >
        {loading ? 'Saving…' : existing ? 'Save changes' : 'Create audition'}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-300">
        {label}
        {required && ' *'}
      </label>
      {children}
    </div>
  );
}
