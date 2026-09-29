import { notFound } from 'next/navigation';
import { getScript } from '@/lib/db';
import AppHeader from '@/components/AppHeader';
import ChatPanel from '@/components/ChatPanel';
import PageBody from '@/components/PageBody';

export const dynamic = 'force-dynamic';

export default async function ScriptChatPage({
  params,
}: {
  params: Promise<{ scriptId: string }>;
}) {
  const { scriptId } = await params;
  const script = await getScript(scriptId);
  if (!script) notFound();

  return (
    <>
      <AppHeader
        title={`Chat: ${script.title}`}
        subtitle={script.character ? `Playing ${script.character}` : 'Whole-script coach'}
        backHref={`/scripts/${script.id}`}
        backLabel={script.title}
      />
      <PageBody>
        <ChatPanel
          endpoint={`/api/scripts/${script.id}/chat`}
          scopeNote="Your coach has read the whole script. For one scene in depth, open that scene’s Chat tab."
          emptyText="Ask about the story, your character’s arc, relationships, or how to approach this material."
          placeholder="Ask about this script…"
          suggestions={[
            'Summarize my character’s arc.',
            'What does my character want across the whole script?',
            'Which scene should I prepare first for an audition?',
          ]}
          heightClass="h-[65dvh] md:h-[72vh]"
        />
      </PageBody>
    </>
  );
}
