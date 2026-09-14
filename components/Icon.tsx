/**
 * A small inline icon set.
 *
 * Deliberately not an icon library: the app needs about a dozen glyphs, and
 * shipping a dependency for that would cost more than it's worth. Every icon
 * is a stroked 24x24 path using currentColor, so it inherits text color and
 * works in all six themes without any per-icon theming.
 */

export type IconName =
  | 'scripts'
  | 'auditions'
  | 'memorize'
  | 'flame'
  | 'plus'
  | 'chevronRight'
  | 'chevronLeft'
  | 'upload'
  | 'logout'
  | 'close'
  | 'check'
  | 'file'
  | 'palette';

const PATHS: Record<IconName, React.ReactNode> = {
  scripts: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H16l4 4v13.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20.5z" />
      <path d="M15 3v5h5" />
      <path d="M8.5 13h7M8.5 17h4" />
    </>
  ),
  auditions: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  memorize: (
    <>
      <path d="M12 6.5a3.5 3.5 0 0 0-7 0v.3A3 3 0 0 0 4 12a3 3 0 0 0 1.5 2.6v.4a3.5 3.5 0 0 0 6.5 1.8z" />
      <path d="M12 6.5a3.5 3.5 0 0 1 7 0v.3A3 3 0 0 1 20 12a3 3 0 0 1-1.5 2.6v.4a3.5 3.5 0 0 1-6.5 1.8z" />
      <path d="M12 6.5V21" />
    </>
  ),
  flame: (
    <path d="M12 3s4.5 3.6 4.5 8.2a4.5 4.5 0 0 1-1.6 3.4c.1-1.6-.6-3-1.8-3.9.2 2-.9 3.3-2.2 4.2A4.7 4.7 0 0 0 9 18.4 5 5 0 0 0 12 21a5.2 5.2 0 0 0 5.2-5.2C17.2 10.5 12 3 12 3" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronLeft: <path d="M15 18l-6-6 6-6" />,
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="M7.5 8.5L12 4l4.5 4.5" />
      <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
    </>
  ),
  logout: (
    <>
      <path d="M14 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4h8" />
      <path d="M17 15l4-3-4-3" />
      <path d="M21 12H10" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  file: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H15l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5z" />
      <path d="M14 3v5h5" />
    </>
  ),
  palette: (
    <>
      <path d="M12 21a9 9 0 1 1 9-9c0 2-1.6 2.8-3 2.8h-1.4a1.9 1.9 0 0 0-1.3 3.3 1.8 1.8 0 0 1-1.3 3z" />
      <circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.8" cy="7.9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};

export default function Icon({
  name,
  size = 18,
  className = '',
  strokeWidth = 1.75,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
