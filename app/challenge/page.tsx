import AppHeader from '@/components/AppHeader';
import PageBody from '@/components/PageBody';
import DailyChallenge from '@/components/DailyChallenge';

export const dynamic = 'force-dynamic';

export default function ChallengePage() {
  return (
    <>
      <AppHeader title="Today's Challenge" />
      <PageBody>
        <DailyChallenge />
      </PageBody>
    </>
  );
}
