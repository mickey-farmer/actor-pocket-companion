'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

const ACCEPTED = ['.pdf', '.txt', '.docx', '.fdx'];

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Turns a server error into something an actor can act on.
 *
 * The server surfaces raw exception messages, so a missing native dependency
 * once reached the UI as "Couldn't read that file: DOMMatrix is not defined".
 * Anything we don't recognise gets a plain-language lead with the technical
 * text kept underneath for a bug report, rather than shown as the headline.
 */
function humanizeError(raw: string): { message: string; detail?: string } {
  const text = raw.trim();

  if (/scanned image|came through empty/i.test(text)) {
    return {
      message:
        "That PDF has no selectable text — it's probably a scan or a photo. Try exporting a text PDF from the original, or upload a .txt.",
    };
  }
  if (/unsupported file type/i.test(text)) {
    return { message: `That file type isn't supported. Use ${ACCEPTED.join(', ')}.` };
  }
  if (/password|encrypted/i.test(text)) {
    return { message: 'That PDF is password-protected. Remove the password and try again.' };
  }
  if (/invalid|corrupt|bad xref|structure/i.test(text)) {
    return {
      message: "That file looks damaged and couldn't be opened.",
      detail: text,
    };
  }
  if (/DOMMatrix|worker|Cannot find module|is not defined|undefined/i.test(text)) {
    return {
      message:
        "Something went wrong on our side reading that file — it's not your file's fault.",
      detail: text,
    };
  }
  return { message: "That file couldn't be read.", detail: text };
}

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
  const titleId = useId();
  const fileId = useId();

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const acceptFile = useCallback((next: File | null) => {
    setError(null);
    setShowDetail(false);
    if (!next) {
      setFile(null);
      return;
    }
    if (!ACCEPTED.includes(extensionOf(next.name))) {
      setFile(null);
      setError({ message: `That file type isn't supported. Use ${ACCEPTED.join(', ')}.` });
      return;
    }
    setFile(next);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (dropped && fileInputRef.current) {
      // Keep the native input in sync so the form still works if the user
      // then submits without touching the picker.
      const dt = new DataTransfer();
      dt.items.add(dropped);
      fileInputRef.current.files = dt.files;
    }
    acceptFile(dropped);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const chosen = file ?? fileInputRef.current?.files?.[0] ?? null;
    if (!chosen) {
      setError({ message: 'Choose a script file first.' });
      return;
    }

    setLoading(true);
    setError(null);
    setShowDetail(false);

    const formData = new FormData();
    formData.append('file', chosen);
    if (title.trim()) formData.append('title', title.trim());

    try {
      const res = await fetch('/api/scripts', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(humanizeError(data?.error || 'Upload failed.'));
        setLoading(false);
        return;
      }
      if (onUploaded) {
        onUploaded(data.scriptId, title.trim() || chosen.name.replace(/\.[^.]+$/, ''));
        setLoading(false);
      } else {
        router.push(`/scripts/${data.scriptId}`);
      }
    } catch {
      setError({ message: 'Upload failed. Check your connection and try again.' });
      setLoading(false);
    }
  }

  const fields = (
    <div className="space-y-4">
      {/* Drop zone. The whole area is the label for a visually-hidden file
          input, so click, keyboard and drag-and-drop all work without
          duplicating a separate "Choose file" control. */}
      <div>
        <label
          htmlFor={fileId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
            dragging
              ? 'border-stage-accent bg-stage-accentSoft/10'
              : 'border-stage-borderStrong bg-stage-panel2/40 hover:border-stage-accent hover:bg-stage-accentSoft/5'
          }`}
        >
          {file ? (
            <>
              <Icon name="file" size={22} className="text-stage-accent" />
              <span className="max-w-full truncate text-sm font-medium text-stage-text">
                {file.name}
              </span>
              <span className="text-xs text-stage-subtle">
                {formatBytes(file.size)} · choose a different file
              </span>
            </>
          ) : (
            <>
              <Icon name="upload" size={22} className="text-stage-subtle" />
              <span className="text-sm font-medium text-stage-text">
                Drop a script here, or browse
              </span>
              <span className="text-xs text-stage-subtle">
                {ACCEPTED.join(' · ')}
              </span>
            </>
          )}
        </label>
        <input
          id={fileId}
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </div>

      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-stage-muted"
          htmlFor={titleId}
        >
          Title <span className="font-normal text-stage-subtle">(optional)</span>
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={file ? file.name.replace(/\.[^.]+$/, '') : 'e.g. Act 2 audition sides'}
          className="w-full rounded-md border border-stage-border bg-stage-panel2 px-3 py-2 text-sm text-stage-text placeholder:text-stage-subtle transition-colors hover:border-stage-borderStrong focus:border-stage-accent"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-stage-danger/40 bg-stage-danger/10 px-3 py-2.5"
        >
          <p className="text-sm text-stage-danger">{error.message}</p>
          {error.detail && (
            <>
              <button
                type="button"
                onClick={() => setShowDetail((v) => !v)}
                className="mt-1 text-xs text-stage-muted underline hover:text-stage-text"
              >
                {showDetail ? 'Hide details' : 'Show details'}
              </button>
              {showDetail && (
                <p className="script-text mt-1.5 break-words text-[11px] leading-relaxed text-stage-subtle">
                  {error.detail}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <button
        type={compact ? 'button' : 'submit'}
        onClick={compact ? () => handleSubmit() : undefined}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-stage-accent px-4 py-2.5 text-sm font-semibold text-stage-onAccent transition-colors hover:bg-stage-accentHover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            Reading script…
          </>
        ) : (
          'Add script'
        )}
      </button>
      {loading && (
        <p className="text-center text-xs text-stage-subtle">
          Extracting text and detecting scenes. Large PDFs can take a few seconds.
        </p>
      )}
    </div>
  );

  // `compact` means we're embedded inside another component's own <form>
  // (e.g. the "Upload new" sides option on the audition form). Nested
  // <form> elements are invalid HTML — browsers silently collapse them at
  // parse time, which is what made the upload button unreliable — so in
  // that case we render a plain <div> and drive the upload from a button
  // click instead of native form submission.
  if (compact) {
    return <div>{fields}</div>;
  }

  return <form onSubmit={handleSubmit}>{fields}</form>;
}
