import AppHeader from '@/components/AppHeader';
import PageBody from '@/components/PageBody';
import VocalHealth from '@/components/Voice/VocalHealth';

export default function VocalHealthPage() {
  return (
    <>
      <AppHeader title="Vocal health" subtitle="Warm up, pace yourself, protect the instrument" backHref="/voice" backLabel="Voice Lab" />
      <PageBody>
        <VocalHealth />
      </PageBody>
    </>
  );
}
