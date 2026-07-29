'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm({
  onUploaded,
  compact = false,
}: {
  // When provided, called with the new script's id/title instead of
  // navigating to /scripts/:id — lets this form be embedded inline
  // elsewhere (e.g. "Upload new" sides on the audition form).
  onUploaded?: (scriptId: string, title: string) => void;
  // Drops the outer card border/heading for embedding inside another panel.
  compact?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Choose a file first.');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (title.trim()) formData.append('title', title.trim());

    try {
      const res = await fetch('/api/scripts', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Upload failed.');
        setLoading(false);
        return;
      }
      if (onUploaded) {
        onUploaded(data.scriptId, title.trim() || file.name.replace(/\.[^.]+$/, ''));
        setLoading(false);
      } else {
        router.push(`/scripts/${data.scriptId}`);
      }
    } catch {
      setError('Upload failed. Check your connection and try again.');
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? 'space-y-3' : 'rounded-lg border border-stage-border bg-stage-panel p-5'}
    >
      {!compact && (
        <h2 className="mb-3 text-lg font-medium text-stage-accent">Upload a script</h2>
      )}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-slate-300" htmlFor="title">
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Act 2 audition sides"
            className="w-full rounded border border-stage-border bg-black/20 px-3 py-2 text-slate-100 outline-none focus:border-stage-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300" htmlFor="file">
            Script file (.pdf, .txt, .docx, .fdx)
          </label>
          <input
            id="file"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.fdx"
            className="w-full rounded border border-stage-border bg-black/20 px-3 py-2 text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-stage-accent file:px-3 file:py-1 file:text-stage-onAccent"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-stage-accent px-4 py-2 font-medium text-stage-onAccent disabled:opacity-50"
        >
          {loading ? 'Uploading…' : 'Upload script'}
        </button>
      </div>
    </form>
  );
}
