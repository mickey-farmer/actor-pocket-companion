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
      className="w-full rounded-xl border border-stage-border bg-stage-panel p-6"
    >
      <label className="mb-1.5 block text-xs font-medium text-stage-muted" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-md border border-stage-border bg-stage-panel2 px-3 py-2 text-sm text-stage-text transition-colors hover:border-stage-borderStrong focus:border-stage-accent"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-stage-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-4 w-full rounded-md bg-stage-accent px-4 py-2.5 text-sm font-semibold text-stage-onAccent transition-colors hover:bg-stage-accentHover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Checking…' : 'Enter'}
      </button>
    </form>
  );
}
