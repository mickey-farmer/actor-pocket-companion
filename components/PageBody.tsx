/**
 * Standard content column for every page.
 *
 * Centralised so the max width, horizontal padding and vertical rhythm are
 * identical everywhere — previously each page repeated its own
 * `mx-auto max-w-3xl px-4 py-6` and they had started to drift.
 *
 * Note this centres inside the shell's content column (which is already
 * offset by the sidebar), not inside the viewport.
 */
export default function PageBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 ${className}`}>
      {children}
    </main>
  );
}
