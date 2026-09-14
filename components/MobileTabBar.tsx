'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { NAV_ITEMS, isNavItemActive } from './navItems';

/**
 * Bottom tab bar — the mobile navigation.
 *
 * Replaces the old top-left hamburger drawer. This app gets used standing up
 * in a rehearsal room or a hallway, one-handed, and a target in the top-left
 * corner is the hardest place on a phone to reach. Tabs sit in the thumb arc
 * and show where you are without opening anything.
 *
 * Scene-level navigation deliberately isn't here: the script page already
 * lists its scenes, so mobile follows the normal list -> detail flow rather
 * than duplicating the desktop tree in a drawer.
 */
export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-stage-border bg-stage-panel/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors ${
                  active
                    ? 'text-stage-accent'
                    : 'text-stage-muted active:text-stage-text'
                }`}
              >
                <Icon name={item.icon} size={22} strokeWidth={active ? 2 : 1.6} />
                <span className="truncate">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
