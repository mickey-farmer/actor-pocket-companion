import AppHeader from '@/components/AppHeader';
import DailyChallenge from '@/components/DailyChallenge';

export const dynamic = 'force-dynamic';

export default function ChallengePage() {
  return (
    <>
      <AppHeader title="Today's Challenge" />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <DailyChallenge />
      </div>
    </>
  );
}
