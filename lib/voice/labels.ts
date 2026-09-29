import type { VoiceCardField, VoiceMedium } from '@/lib/types';

export const MEDIUM_LABELS: Record<VoiceMedium, string> = {
  animation: 'Animation',
  game: 'Video game',
  'anime-dub': 'Anime / dubbing',
  commercial: 'Commercial',
  other: 'Other',
};

export const CARD_FIELD_META: Record<VoiceCardField, { label: string; hint: string }> = {
  age: { label: 'Vocal age', hint: 'How old the voice reads — e.g. “early teens”, “ancient”.' },
  pitch: { label: 'Pitch', hint: 'Where it sits vs. your natural voice, and how much it moves.' },
  placement: { label: 'Placement', hint: 'Nasal/mask, head, forward, throat, chest…' },
  texture: { label: 'Texture', hint: 'Breathy, clean, gravelly, twangy, creaky…' },
  pace: { label: 'Pace & rhythm', hint: 'Clipped and fast? Slow drawl? Halting?' },
  attitude: { label: 'Attitude', hint: 'The point of view that drives the sound.' },
  voice_references: { label: 'References', hint: '“Sounds like X meets Y”, archetypes to listen to.' },
  physicality: { label: 'Physicality', hint: 'A posture, face or gesture that finds the voice fast.' },
};
