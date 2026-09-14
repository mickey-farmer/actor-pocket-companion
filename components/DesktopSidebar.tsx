import Link from 'next/link';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';

export default function DesktopSidebar() {
  return (
    <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-stage-border bg-stage-panel md:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-stage-border px-4">
        <Link
          href="/scripts"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-stage-text"
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded bg-stage-accent text-[11px] font-bold text-stage-onAccent"
          >
            A
          </span>
          Pocket Companion
        </Link>
      </div>
      <SidebarNav />
      <SidebarFooter />
    </aside>
  );
}
