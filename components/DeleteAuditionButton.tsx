'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAuditionButton({ auditionId }: { auditionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this audition record? This cannot be undone.')) return;
    setLoading(true);
    await fetch(`/api/auditions/${auditionId}`, { method: 'DELETE' });
    router.push('/auditions');
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-400 underline hover:text-red-300 disabled:opacity-50"
    >
      {loading ? 'Deleting…' : 'Delete audition'}
    </button>
  );
}
