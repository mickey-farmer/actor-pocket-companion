import Link from 'next/link';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';

/**
 * Desktop sidebar. Collapses to a 4rem icon rail via the toggle in the
 * footer; the width itself is CSS-driven (.apc-sidebar in globals.css) so it
 * applies before hydration.
 */
export default function DesktopSidebar() {
  return (
    <aside className="apc-sidebar no-print fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-stage-border bg-stage-panel md:flex">
      <div className="apc-rail-item flex h-14 shrink-0 items-center overflow-hidden border-b border-stage-border px-4">
        <Link
          href="/scripts"
          aria-label="Pocket Companion home"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-stage-text"
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded bg-stage-accent text-[11px] font-bold text-stage-onAccent"
          >
            A
          </span>
          <span className="apc-expanded-only whitespace-nowrap">Pocket Companion</span>
        </Link>
      </div>
      <SidebarNav />
      <SidebarFooter />
    </aside>
  );
}
