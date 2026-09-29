import AppHeader from '@/components/AppHeader';
import PageBody from '@/components/PageBody';
import VoiceCharacterForm from '@/components/Voice/VoiceCharacterForm';

export default function NewVoiceCharacterPage() {
  return (
    <>
      <AppHeader title="New voice card" backHref="/voice" backLabel="Voice Lab" />
      <PageBody>
        <VoiceCharacterForm />
      </PageBody>
    </>
  );
}
