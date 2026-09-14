import AppHeader from '@/components/AppHeader';
import PageBody from '@/components/PageBody';
import MemorizeLauncher from '@/components/MemorizeLauncher';

export const dynamic = 'force-dynamic';

export default function MemorizePage() {
  return (
    <>
      <AppHeader title="Memorize" />
      <PageBody>
        <MemorizeLauncher />
      </PageBody>
    </>
  );
}
