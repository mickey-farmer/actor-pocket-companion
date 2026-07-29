import type { AuditionStatus } from '@/lib/types';

const STYLES: Record<AuditionStatus, string> = {
  upcoming: 'bg-stage-accent/20 text-stage-accent',
  submitted: 'bg-slate-500/20 text-slate-300',
  callback: 'bg-amber-500/20 text-amber-400',
  booked: 'bg-emerald-500/20 text-emerald-400',
  passed: 'bg-slate-700/40 text-slate-500',
};

const LABELS: Record<AuditionStatus, string> = {
  upcoming: 'Upcoming',
  submitted: 'Submitted',
  callback: 'Callback',
  booked: 'Booked',
  passed: 'Passed',
};

export default function StatusBadge({ status }: { status: AuditionStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
