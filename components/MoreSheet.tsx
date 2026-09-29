'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { NAV_ITEMS, isNavItemActive } from './navItems';
import { THEMES, THEME_BACKDROPS, THEME_LABELS, THEME_SWATCHES, useTheme } from './ThemeContext';
import { logout } from '@/lib/logout';

/**
 * The mobile "More" panel: every destination that doesn't have its own
 * bottom-bar tab, plus the settings that otherwise only exist in the desktop
 * sidebar footer (theme, log out) — before this, phones had no way to reach
 * either.
 *
 * A bottom sheet rather than a side drawer so everything stays in the thumb
 * arc, same reasoning as the tab bar itself.
 */
export default function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const sheetRef = useRef<HTMLDivElement>(null);
  const secondary = NAV_ITEMS.filter((item) => !item.primary);

  // Close on navigation.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // Keep the page behind from scrolling while the sheet is up.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/50"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="More"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-stage-border bg-stage-panel shadow-pop outline-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <span aria-hidden="true" className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-stage-border" />
          <h2 className="text-sm font-semibold text-stage-text">More</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded text-stage-muted hover:bg-stage-panel2 hover:text-stage-text"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <ul className="px-2">
          {secondary.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[3rem] items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                    active
                      ? 'bg-stage-accentSoft/15 text-stage-accent'
                      : 'text-stage-text active:bg-stage-panel2'
                  }`}
                >
                  <Icon name={item.icon} size={20} strokeWidth={active ? 2 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mx-4 my-2 border-t border-stage-border" />

        <div className="px-4 py-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stage-subtle">
            Theme
          </p>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => {
              const active = t === theme;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                    active
                      ? 'border-stage-accent text-stage-accent'
                      : 'border-stage-border text-stage-muted'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stage-border"
                    style={{ backgroundColor: THEME_BACKDROPS[t] }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: THEME_SWATCHES[t] }} />
                  </span>
                  <span className="truncate">{THEME_LABELS[t]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-2 pt-1">
          <button
            type="button"
            onClick={logout}
            className="flex min-h-[3rem] w-full items-center gap-3 rounded-lg px-3 text-[15px] text-stage-muted active:bg-stage-panel2"
          >
            <Icon name="logout" size={20} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
