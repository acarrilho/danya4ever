/**
 * Session signing/verification using the Web Crypto API (SubtleCrypto).
 * Compatible with both Edge Runtime (middleware) and Node.js runtime.
 *
 * Cookie format:  "<adminUserId>.<base64url-HMAC-SHA256-signature>"
 * The '.' separator is safe since UUIDs only contain hex chars and hyphens.
 */

const SEPARATOR = '.'

function getSecret(): string {
  return process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-prod'
}

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function bufToBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64urlToBuf(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '='
  )
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/** Create a signed session value for the given adminUserId. */
export async function createSessionValue(adminUserId: string): Promise<string> {
  const key = await importKey(getSecret())
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(adminUserId))
  return `${adminUserId}${SEPARATOR}${bufToBase64url(sig)}`
}

/**
 * Verify a session value and return the adminUserId, or null if invalid.
 * Uses SubtleCrypto's constant-time verify — no timing leaks.
 */
export async function verifySessionValue(raw: string): Promise<string | null> {
  const idx = raw.indexOf(SEPARATOR)
  if (idx === -1) return null

  const adminUserId = raw.slice(0, idx)
  const sigB64 = raw.slice(idx + 1)
  if (!adminUserId || !sigB64) return null

  try {
    const key = await importKey(getSecret())
    const enc = new TextEncoder()
    const sigBuf = base64urlToBuf(sigB64)
    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(adminUserId))
    return valid ? adminUserId : null
  } catch {
    return null
  }
}
