import Link from 'next/link';
import SidebarNav from './SidebarNav';
import LogoutButton from './LogoutButton';

export default function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-stage-border bg-stage-panel md:flex">
      <Link
        href="/scripts"
        className="border-b border-stage-border px-4 py-4 text-base font-semibold text-stage-accent"
      >
        Actor Pocket Companion
      </Link>
      <SidebarNav />
      <div className="border-t border-stage-border px-2 py-2">
        <LogoutButton />
      </div>
    </aside>
  );
}
