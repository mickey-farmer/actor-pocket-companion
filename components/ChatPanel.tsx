'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChatMessageRow } from '@/lib/types';

export default function ChatPanel({
  scriptId,
  sceneId,
}: {
  scriptId: string;
  sceneId: string;
}) {
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/scripts/${scriptId}/scenes/${sceneId}/chat`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMessages(data.messages ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scriptId, sceneId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, scene_id: sceneId, role: 'user', content: text, created_at: new Date().toISOString() },
    ]);
    setLoading(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}/scenes/${sceneId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't reach the coach. Try again.");
        setLoading(false);
        return;
      }
      setMessages((prev) => [...prev, data.message]);
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="flex h-[55dvh] flex-col rounded-lg border border-stage-border bg-stage-panel md:h-[65vh]">
      <div className="border-b border-stage-border px-4 py-2 text-xs text-slate-400">
        This chat only discusses this scene and character — not general
        writing help.
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loadingHistory && <p className="text-sm text-slate-500">Loading…</p>}
        {!loadingHistory && messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Say hello, or ask where to start — your coach will pick up from the
            moment before.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-stage-accent text-stage-onAccent'
                : 'bg-black/20 text-slate-100'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-sm text-slate-500">Your coach is thinking…</p>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="px-4 pb-1 text-sm text-red-400">{error}</p>}
      <div className="flex gap-2 border-t border-stage-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Talk with your scene coach…"
          className="flex-1 rounded border border-stage-border bg-black/20 px-3 py-2 text-slate-100 outline-none focus:border-stage-accent"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded bg-stage-accent px-4 py-2 font-medium text-stage-onAccent disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
