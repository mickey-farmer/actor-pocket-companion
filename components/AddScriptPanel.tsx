'use client';

import { useState } from 'react';
import Icon from './Icon';
import UploadForm from './UploadForm';

/**
 * The "add a script" affordance on the library page.
 *
 * Collapsed by default when you already have scripts. The upload form used
 * to be the first and largest thing on the page, above the library — but
 * uploading is something you do occasionally, while opening an existing
 * script is what you do every day. Starts open when the library is empty,
 * since then it's the only thing to do.
 */
export default function AddScriptPanel({
  startOpen = false,
}: {
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stage-border px-4 py-3 text-sm font-medium text-stage-muted transition-colors hover:border-stage-accent hover:bg-stage-accentSoft/5 hover:text-stage-accent"
      >
        <Icon name="plus" size={16} strokeWidth={2} />
        Add a script
      </button>
    );
  }

  return (
    <section className="rounded-lg border border-stage-border bg-stage-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-stage-text">Add a script</h2>
        {!startOpen && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cancel"
            className="flex h-7 w-7 items-center justify-center rounded text-stage-subtle transition-colors hover:bg-stage-panel2 hover:text-stage-text"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <UploadForm />
    </section>
  );
}
