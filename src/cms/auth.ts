// Session & password authentication utilities using native Web Crypto API

const DEFAULT_SECRET = 'acree-poc-secret-key-2026';

/**
 * Hash a plain text password using SHA-256.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sign a session string (e.g. username) using HMAC-SHA256.
 */
export async function signSession(username: string, secret: string = DEFAULT_SECRET): Promise<string> {
  const encoder = new TextEncoder();
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry
  const payload = `${username}:${expiry}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${payload}.${signatureHex}`;
}

/**
 * Verify a signed session cookie and return the username if valid.
 */
export async function verifySession(token: string | undefined, secret: string = DEFAULT_SECRET): Promise<string | null> {
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signatureHex] = parts;
  const payloadParts = payload.split(':');
  if (payloadParts.length !== 2) return null;

  const [username, expiryStr] = payloadParts;
  const expiry = parseInt(expiryStr, 10);

  // Check expiry
  if (Date.now() > expiry) return null;

  // Re-verify signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Convert hex signature back to bytes
  const signatureBytes = new Uint8Array(
    signatureHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payload)
  );

  return isValid ? username : null;
}
