import Link from 'next/link';
import { listScripts } from '@/lib/db';
import AppHeader from '@/components/AppHeader';
import ChatPanel from '@/components/ChatPanel';
import Icon from '@/components/Icon';
import PageBody from '@/components/PageBody';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const scripts = await listScripts();

  return (
    <>
      <AppHeader
        title="Coach Chat"
        subtitle="Ask anything about acting, auditions or voice work"
        actions={
          <Link
            href="/glossary"
            className="flex items-center gap-1.5 rounded border border-stage-border px-2.5 py-1.5 text-xs font-medium text-stage-muted transition-colors hover:border-stage-accent hover:text-stage-accent"
          >
            <Icon name="book" size={15} />
            Glossary
          </Link>
        }
      />
      <PageBody className="space-y-4">
        <ChatPanel
          endpoint="/api/chat"
          scopeNote="General acting coach — craft, auditions, self-tapes, voice acting and career."
          emptyText="What are you working on? Ask about technique, an upcoming audition, a self-tape, voice work — anything performance."
          placeholder="Ask your coach…"
          suggestions={[
            'Give me a 10-minute warm-up before an audition.',
            'How do I make a strong choice on a cold read?',
            'What should a first animation voice demo include?',
          ]}
          heightClass="h-[60dvh] md:h-[68vh]"
        />

        {scripts.length > 0 && (
          <div className="rounded-lg border border-stage-border bg-stage-panel px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stage-subtle">
              Or chat about a specific script
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {scripts.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/scripts/${s.id}/chat`}
                    className="block rounded-full border border-stage-border px-3 py-1.5 text-xs text-stage-muted transition-colors hover:border-stage-accent hover:text-stage-text"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PageBody>
    </>
  );
}
