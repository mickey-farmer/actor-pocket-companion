import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';
import RegisterServiceWorker from '@/components/RegisterServiceWorker';
import { ThemeProvider } from '@/components/ThemeContext';

export const metadata: Metadata = {
  title: 'Actor Pocket Companion',
  description: 'A private rehearsal companion for scripts, character work, and lines.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#181a1f',
};

// Keep this list in sync with THEMES in components/ThemeContext.tsx — it's
// duplicated here (rather than imported) so the anti-flash script stays a
// plain inline string with no bundling/import concerns.
const INIT_SCRIPT = `
(function () {
  var valid = ['dusk', 'slate', 'pink', 'sage', 'dark', 'light'];
  try {
    var stored = localStorage.getItem('apc-theme');
    document.documentElement.setAttribute('data-theme', valid.indexOf(stored) !== -1 ? stored : 'dusk');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dusk');
  }
  // Desktop sidebar collapsed state — see lib/useSidebarCollapsed.ts.
  try {
    if (localStorage.getItem('apc-sidebar') === 'collapsed') {
      document.documentElement.setAttribute('data-sidebar', 'collapsed');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-stage-bg font-sans text-stage-text antialiased">
        {/* A plain inline script, first thing in <body>, so the browser runs
            it while parsing — before the sidebar or any themed content is
            painted. (next/script's beforeInteractive only queues the code
            for Next's runtime to run later, which could flash the default
            theme and animate a collapsed sidebar shut on every load.) */}
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
        <RegisterServiceWorker />
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
