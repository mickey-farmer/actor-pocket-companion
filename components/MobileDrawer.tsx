'use client';

import Link from 'next/link';
import { useNavDrawer } from './NavContext';
import SidebarNav from './SidebarNav';
import LogoutButton from './LogoutButton';

export default function MobileDrawer() {
  const { isOpen, close } = useNavDrawer();

  return (
    <>
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-stage-border bg-stage-panel transition-transform duration-200 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-stage-border px-4 py-4">
          <Link
            href="/scripts"
            onClick={close}
            className="text-base font-semibold text-stage-accent"
          >
            Actor Pocket Companion
          </Link>
          <button
            onClick={close}
            aria-label="Close menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-300"
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
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <SidebarNav onNavigate={close} />
        <div className="border-t border-stage-border px-2 py-2">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
