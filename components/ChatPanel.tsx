'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChatMessageRow } from '@/lib/types';

type Bubble = Pick<ChatMessageRow, 'id' | 'role' | 'content'>;

/**
 * The coach chat UI, shared by the scene chat, the whole-script chat and the
 * general Coach page. Each one just points at a different API endpoint that
 * supports GET (history), POST ({ message }) and DELETE (clear).
 */
export default function ChatPanel({
  endpoint,
  scopeNote,
  emptyText,
  placeholder = 'Talk with your coach…',
  suggestions = [],
  heightClass = 'h-[55dvh] md:h-[65vh]',
}: {
  endpoint: string;
  scopeNote: string;
  emptyText: string;
  placeholder?: string;
  /** Starter prompts shown while the conversation is empty. */
  suggestions?: string[];
  heightClass?: string;
}) {
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMessages(data.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this conversation.");
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't reach the coach. Try again.");
      } else {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  }

  async function clear() {
    if (!window.confirm('Clear this conversation? This can’t be undone.')) return;
    const res = await fetch(endpoint, { method: 'DELETE' }).catch(() => null);
    if (res?.ok) {
      setMessages([]);
      setError(null);
    } else {
      setError("Couldn't clear the conversation. Try again.");
    }
  }

  const empty = !loadingHistory && messages.length === 0;

  return (
    <div
      className={`flex flex-col rounded-lg border border-stage-border bg-stage-panel ${heightClass}`}
    >
      <div className="flex items-center gap-3 border-b border-stage-border px-4 py-2">
        <p className="min-w-0 flex-1 text-xs text-stage-muted">{scopeNote}</p>
        {messages.length > 0 && (
          <button
            onClick={clear}
            disabled={loading}
            className="shrink-0 text-xs text-stage-subtle hover:text-stage-danger disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loadingHistory && <p className="text-sm text-stage-subtle">Loading…</p>}
        {empty && (
          <div className="space-y-3">
            <p className="text-sm text-stage-subtle">{emptyText}</p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-stage-border px-3 py-1.5 text-left text-xs text-stage-muted transition-colors hover:border-stage-accent hover:text-stage-text"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-stage-accent text-stage-onAccent'
                : 'bg-stage-panel2 text-stage-text'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-sm text-stage-subtle">Your coach is thinking…</p>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="px-4 pb-1 text-sm text-stage-danger">{error}</p>}
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
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded border border-stage-border bg-stage-panel2 px-3 py-2 text-stage-text outline-none focus:border-stage-accent"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="rounded bg-stage-accent px-4 py-2 font-medium text-stage-onAccent disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
