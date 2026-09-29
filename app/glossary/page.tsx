import AppHeader from '@/components/AppHeader';
import GlossaryBrowser from '@/components/GlossaryBrowser';
import PageBody from '@/components/PageBody';

export default function GlossaryPage() {
  return (
    <>
      <AppHeader title="Glossary" subtitle="Stage, screen, voice and the business" />
      <PageBody className="!pt-2">
        <GlossaryBrowser />
      </PageBody>
    </>
  );
}
