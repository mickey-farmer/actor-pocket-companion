import type { VoiceCharacterInput } from '@/lib/db';
import {
  VOCAL_SESSION_KINDS,
  VOICE_CARD_FIELDS,
  VOICE_MEDIUMS,
  type VocalSessionKind,
  type VoiceMedium,
} from '@/lib/types';

const TEXT_FIELDS = ['name', 'project', 'description', 'sample_lines', 'notes', ...VOICE_CARD_FIELDS] as const;
const MAX_FIELD_LENGTH = 20_000;

/** Picks only known voice-card fields out of a request body. */
export function parseVoiceCharacterInput(body: unknown): VoiceCharacterInput {
  const src = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const out: VoiceCharacterInput = {};
  for (const key of TEXT_FIELDS) {
    const v = src[key];
    if (typeof v === 'string') out[key] = v.slice(0, MAX_FIELD_LENGTH);
  }
  if (typeof src.medium === 'string' && (VOICE_MEDIUMS as readonly string[]).includes(src.medium)) {
    out.medium = src.medium as VoiceMedium;
  }
  if (out.name !== undefined) out.name = out.name.trim();
  return out;
}

export function isVocalSessionKind(v: unknown): v is VocalSessionKind {
  return typeof v === 'string' && (VOCAL_SESSION_KINDS as readonly string[]).includes(v);
}
