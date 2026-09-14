import Link from 'next/link';
import Icon from './Icon';

/**
 * Page header.
 *
 * Title is left-aligned and actions sit on the right — it used to be centred
 * with Log out next to it, which read like a title bar rather than a page
 * header and put a sign-out control where page controls belong. Sign out now
 * lives only in the sidebar footer.
 *
 * No hamburger button: mobile navigation is the bottom tab bar.
 */
export default function AppHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  /** Page-specific controls, rendered at the right of the header. */
  actions?: React.ReactNode;
}) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-stage-border bg-stage-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4 sm:px-6">
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel ? `Back to ${backLabel}` : 'Back'}
            className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded text-stage-muted transition-colors hover:bg-stage-panel2 hover:text-stage-text"
          >
            <Icon name="chevronLeft" size={18} strokeWidth={2} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-stage-text">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-stage-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </header>
  );
}
