'use client';

// Browser audio recording via MediaRecorder, for the Voice Lab booth.
//
// The browser's "call" processing (echo cancellation, noise suppression,
// auto gain) is turned off on purpose: it's tuned for meetings and actively
// fights voice work — it ducks efforts and screams, gates breaths, and pumps
// the level on quiet reads. We want the raw mic.

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Recording {
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

// First one the browser supports wins. Safari records mp4/AAC; Chrome and
// Firefox record webm/ogg with Opus.
const PREFERRED_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/webm',
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return PREFERRED_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

export function useRecorder() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<((r: Recording | null) => void) | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
        typeof MediaRecorder !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia
    );
  }, []);

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // Never leave the mic open after leaving the page.
  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    releaseMic();
  }, [releaseMic]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        releaseMic();
        setIsRecording(false);
        resolveRef.current?.(blob.size ? { blob, mimeType: type, durationMs } : null);
        resolveRef.current = null;
      };

      startedAtRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 200);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      releaseMic();
      const name = (err as DOMException)?.name;
      setError(
        name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser’s site settings and try again.'
          : 'Couldn’t start recording. Check that a microphone is connected.'
      );
    }
  }, [releaseMic]);

  /** Stops recording and resolves with the finished take (or null if empty). */
  const stop = useCallback((): Promise<Recording | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return Promise.resolve(null);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      recorder.stop();
    });
  }, []);

  return { isSupported, isRecording, elapsedMs, error, start, stop };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
