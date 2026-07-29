'use client';

// Presentational only — the parent owns the useTextToSpeech() hook instance
// so that starting one line's speech correctly stops any other line's
// button from showing as "speaking" too.
export default function SpeakButton({
  isSpeaking,
  onClick,
  label = 'Speak',
  className = '',
}: {
  isSpeaking: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isSpeaking ? 'Stop speaking' : label}
      className={`shrink-0 rounded px-2 py-1 text-xs ${
        isSpeaking
          ? 'bg-stage-accent text-stage-onAccent'
          : 'border border-stage-border text-slate-400 hover:border-stage-accent hover:text-stage-accent'
      } ${className}`}
    >
      {isSpeaking ? '■ Stop' : '🔊 Speak'}
    </button>
  );
}
