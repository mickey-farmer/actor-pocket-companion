import AppHeader from '@/components/AppHeader';
import PageBody from '@/components/PageBody';
import AuditionForm from '@/components/AuditionForm';

export const dynamic = 'force-dynamic';

export default function NewAuditionPage() {
  return (
    <>
      <AppHeader title="New Audition" backHref="/auditions" backLabel="Auditions" />
      <PageBody>
        <AuditionForm />
      </PageBody>
    </>
  );
}
