'use client';

import Icon from './Icon';
import ThemePicker from './ThemePicker';

/**
 * Sidebar footer: theme switcher and sign out.
 *
 * Log out lives here and nowhere else. It used to appear twice at once —
 * in the page header and again at the bottom of the sidebar — which is both
 * visual noise and a real hazard, since a destructive-ish action sat next to
 * the page title where you'd expect page controls.
 */
export default function SidebarFooter() {
  return (
    <div className="shrink-0 border-t border-stage-border p-2">
      <ThemePicker />
      <button
        type="button"
        onClick={() => {
          fetch('/api/logout', { method: 'POST' }).then(() => {
            window.location.href = '/login';
          });
        }}
        className="mt-1 flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-sm text-stage-muted transition-colors hover:bg-stage-panel2 hover:text-stage-text"
      >
        <Icon name="logout" size={17} />
        Log out
      </button>
    </div>
  );
}
