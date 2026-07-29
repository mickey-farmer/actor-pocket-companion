'use client';

// Thin wrapper around the browser's built-in SpeechSynthesis API so scene
// partner lines can be read aloud during rehearsal — no backend, no cost.
// Not supported in every browser, so callers should check `isSupported`
// before rendering any speak controls.

import { useCallback, useEffect, useState } from 'react';

interface SpeakOptions {
  rate?: number;
  onEnd?: () => void;
}

export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  }, []);

  const speak = useCallback((text: string, id: string, options: SpeakOptions = {}) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1;
    utterance.onend = () => {
      setSpeakingId((current) => (current === id ? null : current));
      options.onEnd?.();
    };
    utterance.onerror = () => {
      // If speech fails for any reason (permissions, engine hiccup, etc.),
      // still fire onEnd so a sequenced caller like "Run the Scene" doesn't
      // get stuck waiting on a line that will never finish.
      setSpeakingId((current) => (current === id ? null : current));
      options.onEnd?.();
    };
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }, []);

  // If the component using this hook unmounts (e.g. switching drill modes
  // mid-line), stop any speech in flight rather than letting it run on.
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { isSupported, speakingId, speak, stop };
}
