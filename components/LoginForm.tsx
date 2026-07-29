'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Incorrect password');
        setLoading(false);
        return;
      }
      const next = params.get('next') || '/scripts';
      router.push(next);
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-lg border border-stage-border bg-stage-panel p-6 shadow-sm"
    >
      <label className="mb-2 block text-sm text-slate-300" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border border-stage-border bg-black/20 px-3 py-2 text-slate-100 outline-none focus:border-stage-accent"
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-4 w-full rounded bg-stage-accent px-4 py-2 font-medium text-stage-onAccent disabled:opacity-50"
      >
        {loading ? 'Checking…' : 'Enter'}
      </button>
    </form>
  );
}
