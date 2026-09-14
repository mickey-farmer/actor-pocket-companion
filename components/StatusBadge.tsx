import type { AuditionStatus } from '@/lib/types';

const STYLES: Record<AuditionStatus, string> = {
  upcoming: 'bg-stage-accent/20 text-stage-accent',
  submitted: 'bg-stage-borderStrong/20 text-stage-muted',
  callback: 'bg-stage-warning/20 text-stage-warning',
  booked: 'bg-stage-success/20 text-stage-success',
  passed: 'bg-stage-panel2/40 text-stage-subtle',
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
