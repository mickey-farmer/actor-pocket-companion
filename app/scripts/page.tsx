import Link from 'next/link';
import { listScripts } from '@/lib/db';
import UploadForm from '@/components/UploadForm';
import AppHeader from '@/components/AppHeader';

export const dynamic = 'force-dynamic';

export default async function ScriptsPage() {
  const scripts = await listScripts();

  return (
    <>
      <AppHeader title="Your Scripts" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <UploadForm />

        <div>
          <h2 className="mb-2 text-sm uppercase tracking-wide text-slate-400">
            Library
          </h2>
          {scripts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nothing uploaded yet. Add a script above to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {scripts.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/scripts/${s.id}`}
                    className="block rounded border border-stage-border bg-stage-panel px-4 py-3 hover:border-stage-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{s.title}</div>
                        <div className="text-xs text-slate-400">
                          {s.filename}
                          {s.character ? ` · playing ${s.character}` : ' · character not set'}
                        </div>
                      </div>
                      {s.source_audition_id && (
                        <span className="shrink-0 rounded-full bg-stage-accent/20 px-2 py-1 text-xs font-medium text-stage-accent">
                          Audition
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
