import type { IconName } from './Icon';

/**
 * The app's top-level destinations, in one place so the desktop sidebar and
 * the mobile tab bar can't drift apart.
 *
 * Ordered by how often you'd reach for them while actually working, which is
 * also thumb-priority order on the mobile tab bar.
 */
export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile tab bar, where width is tight. */
  shortLabel: string;
  icon: IconName;
  /**
   * Gets its own tab in the mobile bottom bar. Everything else lives behind
   * the bar's "More" tab — the bar only has room for about five targets.
   */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/scripts', label: 'Scripts', shortLabel: 'Scripts', icon: 'scripts', primary: true },
  { href: '/chat', label: 'Coach Chat', shortLabel: 'Coach', icon: 'chat', primary: true },
  { href: '/voice', label: 'Voice Lab', shortLabel: 'Voice', icon: 'mic', primary: true },
  { href: '/auditions', label: 'Auditions', shortLabel: 'Auditions', icon: 'auditions', primary: true },
  { href: '/memorize', label: 'Memorize', shortLabel: 'Memorize', icon: 'memorize' },
  { href: '/challenge', label: "Today's Challenge", shortLabel: 'Today', icon: 'flame' },
  { href: '/glossary', label: 'Glossary', shortLabel: 'Glossary', icon: 'book' },
];

/**
 * Whether a nav item should read as active for the current pathname.
 * Section-aware, so /scripts/abc/scenes/1 still highlights Scripts.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
