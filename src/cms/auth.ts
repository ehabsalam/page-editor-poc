import { env } from 'cloudflare:workers';

const PBKDF2_ITERATIONS = 210_000;
// Session & password authentication utilities using Web Crypto API

export const SESSION_TTL_SECONDS = 24 * 60 * 60;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

function getSessionSecret(): string {
  const secret = env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return secret;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Hash a password with PBKDF2-SHA256 and a random salt.
 * Stored format: pbkdf2-sha256$<iterations>$<salt_b64>$<hash_b64>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/**
 * Verify a password against a stored PBKDF2 hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') {
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 1) {
    return false;
  }

  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const actual = await derivePbkdf2(password, salt, iterations);

  return constantTimeEqual(actual, expected);
}

async function signPayload(payload: string): Promise<string> {
  const secret = getSessionSecret();
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${payload}.${signatureHex}`;
}

async function verifySignedPayload(token: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signatureHex] = parts;
  const secret = getSessionSecret();
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signatureBytes = new Uint8Array(
    signatureHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payload),
  );

  return isValid ? payload : null;
}

/**
 * Create a server-side session in KV and return a signed session token for the cookie.
 */
export async function createSession(username: string): Promise<string> {
  const kv = env.SESSION;
  if (!kv) {
    throw new Error('SESSION KV binding is required');
  }

  const sessionId = crypto.randomUUID();
  const expiry = Date.now() + SESSION_TTL_MS;

  await kv.put(
    `session:${sessionId}`,
    JSON.stringify({ username, expiry }),
    { expirationTtl: SESSION_TTL_SECONDS },
  );

  return signPayload(`${sessionId}:${expiry}`);
}

/**
 * Verify a signed session cookie and confirm the session is still active in KV.
 */
export async function verifySession(token: string | undefined): Promise<string | null> {
  if (!token) return null;

  const kv = env.SESSION;
  if (!kv) return null;

  let payload: string;
  try {
    const verified = await verifySignedPayload(token);
    if (!verified) return null;
    payload = verified;
  } catch {
    return null;
  }

  const payloadParts = payload.split(':');
  if (payloadParts.length !== 2) return null;

  const [sessionId, expiryStr] = payloadParts;
  const expiry = parseInt(expiryStr, 10);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

  const raw = await kv.get(`session:${sessionId}`);
  if (!raw) return null;

  const session = JSON.parse(raw) as { username: string; expiry: number };
  if (Date.now() > session.expiry) {
    await kv.delete(`session:${sessionId}`);
    return null;
  }

  return session.username;
}

/**
 * Invalidate a session server-side (logout).
 */
export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;

  const kv = env.SESSION;
  if (!kv) return;

  try {
    const payload = await verifySignedPayload(token);
    if (!payload) return;

    const [sessionId] = payload.split(':');
    if (sessionId) {
      await kv.delete(`session:${sessionId}`);
    }
  } catch {
    // Ignore invalid tokens during logout
  }
}
