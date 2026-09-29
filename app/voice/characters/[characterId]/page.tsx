import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVoiceCharacter } from '@/lib/db';
import AppHeader from '@/components/AppHeader';
import Icon from '@/components/Icon';
import PageBody from '@/components/PageBody';
import VoiceCharacterForm from '@/components/Voice/VoiceCharacterForm';

export const dynamic = 'force-dynamic';

export default async function VoiceCharacterPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const character = await getVoiceCharacter(characterId);
  if (!character) notFound();

  return (
    <>
      <AppHeader
        title={character.name}
        subtitle={character.project || 'Voice card'}
        backHref="/voice"
        backLabel="Voice Lab"
        actions={
          <Link
            href={`/voice/booth?character=${character.id}`}
            className="flex items-center gap-1.5 rounded-md bg-stage-accent px-3 py-1.5 text-xs font-semibold text-stage-onAccent transition-colors hover:bg-stage-accentHover"
          >
            <Icon name="mic" size={14} strokeWidth={2} />
            Open in Booth
          </Link>
        }
      />
      <PageBody>
        {/* key: remount the form with fresh values after a save + refresh */}
        <VoiceCharacterForm key={character.updated_at} character={character} />
      </PageBody>
    </>
  );
}
