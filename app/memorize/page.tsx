import AppHeader from '@/components/AppHeader';
import MemorizeLauncher from '@/components/MemorizeLauncher';

export const dynamic = 'force-dynamic';

export default function MemorizePage() {
  return (
    <>
      <AppHeader title="Memorize" />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <MemorizeLauncher />
      </div>
    </>
  );
}
