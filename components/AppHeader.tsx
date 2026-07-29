'use client';

import Link from 'next/link';
import LogoutButton from './LogoutButton';
import ThemePicker from './ThemePicker';
import { useNavDrawer } from './NavContext';

export default function AppHeader({
  title,
  subtitle,
  backHref,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const { toggle } = useNavDrawer();

  return (
    <header className="no-print sticky top-0 z-20 border-b border-stage-border bg-stage-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-1 px-3 py-3">
        <button
          onClick={toggle}
          aria-label="Open menu"
          className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded text-slate-300 hover:text-stage-accent md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel ? `Back to ${backLabel}` : 'Back'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-slate-300 hover:text-stage-accent"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-stage-accent">{title}</div>
          {subtitle && <div className="truncate text-xs text-slate-400">{subtitle}</div>}
        </div>
        <LogoutButton />
        <ThemePicker />
      </div>
    </header>
  );
}
