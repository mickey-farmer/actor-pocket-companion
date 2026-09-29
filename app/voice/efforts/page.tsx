import AppHeader from '@/components/AppHeader';
import PageBody from '@/components/PageBody';
import EffortsLibrary from '@/components/Voice/EffortsLibrary';

export default function EffortsPage() {
  return (
    <>
      <AppHeader title="Efforts & barks" subtitle="Game and animation non-verbals" backHref="/voice" backLabel="Voice Lab" />
      <PageBody>
        <EffortsLibrary />
      </PageBody>
    </>
  );
}
