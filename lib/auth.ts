// Minimal signed-cookie session, built on Web Crypto so it works in both
// the Node runtime (API routes) and the Edge runtime (middleware) without
// extra dependencies.

const COOKIE_NAME = 'apc_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET is not set. Add it to your environment variables.'
    );
  }
  return secret;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let str = '';
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

/** Creates a signed session token containing an expiry timestamp. */
export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${expires}`;
  const key = await hmacKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

/** Verifies a session token. Returns true if valid and not expired. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  try {
    const secret = getSecret();
    const key = await hmacKey(secret);
    const encoder = new TextEncoder();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sig),
      encoder.encode(payload)
    );
    return valid;
  } catch {
    return false;
  }
}

// Hardcoded for personal/local use so you don't have to fight environment
// variables. EDIT THE LINE BELOW with your own password before running the
// app. If you ever push this repo somewhere public, this value goes with
// it — swap back to reading from process.env.APP_PASSWORD before then.
const HARDCODED_APP_PASSWORD = '6425Eylee!@#$%^';

export function checkPassword(candidate: string): boolean {
  return candidate === HARDCODED_APP_PASSWORD;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
