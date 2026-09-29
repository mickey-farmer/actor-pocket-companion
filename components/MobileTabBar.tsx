'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import MoreSheet from './MoreSheet';
import { NAV_ITEMS, isNavItemActive } from './navItems';

/**
 * Bottom tab bar — the mobile navigation.
 *
 * Replaces the old top-left hamburger drawer. This app gets used standing up
 * in a rehearsal room or a hallway, one-handed, and a target in the top-left
 * corner is the hardest place on a phone to reach. Tabs sit in the thumb arc
 * and show where you are without opening anything.
 *
 * Only the `primary` nav items get a tab; the rest (plus theme and log out)
 * sit behind a "More" tab that opens a bottom sheet.
 *
 * Scene-level navigation deliberately isn't here: the script page already
 * lists its scenes, so mobile follows the normal list -> detail flow rather
 * than duplicating the desktop tree in a drawer.
 */
export default function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const primary = NAV_ITEMS.filter((item) => item.primary);
  // Highlight More when you're on one of the pages it holds.
  const moreActive = NAV_ITEMS.some(
    (item) => !item.primary && isNavItemActive(item.href, pathname)
  );
  const tabClass = (active: boolean) =>
    `flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors ${
      active ? 'text-stage-accent' : 'text-stage-muted active:text-stage-text'
    }`;

  return (
    <>
      <nav
        aria-label="Main"
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-stage-border bg-stage-panel/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <ul className="flex items-stretch">
          {primary.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={tabClass(active)}
                >
                  <Icon name={item.icon} size={22} strokeWidth={active ? 2 : 1.6} />
                  <span className="truncate">{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className={tabClass(moreActive || moreOpen)}
            >
              <Icon name="more" size={22} strokeWidth={moreActive ? 2 : 1.6} />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onClose={closeMore} />
    </>
  );
}
