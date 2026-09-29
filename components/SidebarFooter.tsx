'use client';

import Icon from './Icon';
import ThemePicker from './ThemePicker';
import { logout } from '@/lib/logout';
import { useSidebarCollapsed } from '@/lib/useSidebarCollapsed';

const rowClass =
  'apc-rail-item mt-1 flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-sm text-stage-muted transition-colors hover:bg-stage-panel2 hover:text-stage-text';

/**
 * Sidebar footer: theme switcher, sign out, and the collapse toggle.
 *
 * Log out lives here (and in the mobile More sheet) and nowhere else. It used
 * to appear twice at once — in the page header and again at the bottom of the
 * sidebar — which is both visual noise and a real hazard, since a
 * destructive-ish action sat next to the page title where you'd expect page
 * controls.
 */
export default function SidebarFooter() {
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <div className="shrink-0 border-t border-stage-border p-2">
      <ThemePicker />
      <button type="button" onClick={logout} aria-label="Log out" title="Log out" className={rowClass}>
        <Icon name="logout" size={17} />
        <span className="apc-expanded-only whitespace-nowrap">Log out</span>
      </button>
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={rowClass}
      >
        <Icon name="sidebar" size={17} className="apc-collapse-icon transition-transform" />
        <span className="apc-expanded-only whitespace-nowrap">Collapse</span>
      </button>
    </div>
  );
}
