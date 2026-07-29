import AppHeader from '@/components/AppHeader';
import AuditionForm from '@/components/AuditionForm';

export const dynamic = 'force-dynamic';

export default function NewAuditionPage() {
  return (
    <>
      <AppHeader title="New Audition" backHref="/auditions" backLabel="Auditions" />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <AuditionForm />
      </div>
    </>
  );
}
