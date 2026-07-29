'use client';

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        fetch('/api/logout', { method: 'POST' }).then(() => {
          window.location.href = '/login';
        });
      }}
      className="shrink-0 rounded px-2 py-2 text-xs text-slate-400 underline hover:text-slate-200"
    >
      Log out
    </button>
  );
}
