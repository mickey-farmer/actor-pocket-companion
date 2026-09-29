import { listVoiceCharacters } from '@/lib/db';
import AppHeader from '@/components/AppHeader';
import PageBody from '@/components/PageBody';
import Booth from '@/components/Voice/Booth';

export const dynamic = 'force-dynamic';

export default async function BoothPage({
  searchParams,
}: {
  searchParams: Promise<{ character?: string; line?: string; context?: string }>;
}) {
  const { character, line, context } = await searchParams;
  const characters = await listVoiceCharacters();
  const initialCharacterId = characters.some((c) => c.id === character) ? character! : null;

  return (
    <>
      <AppHeader title="Booth" subtitle="Record, direct, repeat" backHref="/voice" backLabel="Voice Lab" />
      <PageBody>
        <Booth
          characters={characters}
          initialCharacterId={initialCharacterId}
          initialLine={line ?? ''}
          initialContext={context ?? ''}
        />
      </PageBody>
    </>
  );
}
