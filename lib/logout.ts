'use client';

/** Ends the session and returns to the login screen. */
export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST' }).catch(() => null);
  window.location.href = '/login';
}
