import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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
  themeColor: '#3a4048',
};

// Keep this list in sync with THEMES in components/ThemeContext.tsx — it's
// duplicated here (rather than imported) so the anti-flash script stays a
// plain inline string with no bundling/import concerns.
const THEME_INIT_SCRIPT = `
(function () {
  var valid = ['dusk', 'slate', 'pink', 'sage', 'dark', 'light'];
  try {
    var stored = localStorage.getItem('apc-theme');
    document.documentElement.setAttribute('data-theme', valid.indexOf(stored) !== -1 ? stored : 'dusk');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dusk');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-stage-bg text-stage-text font-serif">
        {/* Runs before hydration so the saved theme applies with no flash
            of the default "dusk" theme on load. */}
        <Script id="apc-theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <RegisterServiceWorker />
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
