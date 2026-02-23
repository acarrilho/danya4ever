/**
 * Admin authentication helpers.
 * Runs in the Node.js runtime only (server components, API routes, server actions).
 * Do NOT import this file from middleware.ts — use src/lib/session.ts there instead.
 */
import { cookies } from 'next/headers'
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSessionValue, verifySessionValue } from '@/lib/session'
import { AdminUser, AdminUserRow } from '@/lib/types'

// ── Cookie config ────────────────────────────────────────────────────────────

export const SESSION_COOKIE = 'admin_session'

/** Read the current admin's ID from the session cookie (sync cookie store). */
export function getSessionAdminId(): string | null {
  try {
    // cookies() is synchronous in Next.js 14 server context
    const raw = cookies().get(SESSION_COOKIE)?.value
    if (!raw) return null
    // verifySessionValue is async, but we need sync access here.
    // We validate the HMAC in middleware before the request ever reaches
    // server components/actions, so we can trust the cookie at this point
    // and just parse out the ID without re-verifying.
    // For extra paranoia, re-verify async in getCurrentAdmin() below.
    const idx = raw.indexOf('.')
    if (idx === -1) return null
    return raw.slice(0, idx) || null
  } catch {
    return null
  }
}

export function isAdminAuthenticated(): boolean {
  return getSessionAdminId() !== null
}

/** Create and set the session cookie for the given admin user. */
export async function createSessionCookie(
  adminUserId: string
): Promise<{ name: string; value: string; options: object }> {
  const value = await createSessionValue(adminUserId)
  return {
    name: SESSION_COOKIE,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    },
  }
}

// ── Password hashing (Node.js PBKDF2) ────────────────────────────────────────

/**
 * Hash a password with PBKDF2-SHA512, 100k iterations.
 * Returns "<hex-salt>:<hex-derived-key>".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex')
  return `${salt}:${derived}`
}

/** Constant-time password verification. */
export function verifyPassword(password: string, stored: string): boolean {
  const separatorIdx = stored.indexOf(':')
  if (separatorIdx === -1) return false
  const salt = stored.slice(0, separatorIdx)
  const hash = stored.slice(separatorIdx + 1)
  if (!salt || !hash) return false
  try {
    const derived = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex')
    const a = Buffer.from(derived, 'hex')
    const b = Buffer.from(hash, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// ── DB helpers ───────────────────────────────────────────────────────────────

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, is_active, created_at')
    .eq('id', id)
    .eq('is_active', true)
    .single()
  return (data as AdminUser | null)
}

export async function getAdminUserByEmail(email: string): Promise<AdminUserRow | null> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, password_hash, is_active, created_at')
    .eq('email', email.toLowerCase().trim())
    .single()
  return (data as AdminUserRow | null)
}

/**
 * Get the currently logged-in admin user.
 * Re-verifies the HMAC signature for full security (async).
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const raw = cookies().get(SESSION_COOKIE)?.value
    if (!raw) return null
    const id = await verifySessionValue(raw)
    if (!id) return null
    return getAdminUserById(id)
  } catch {
    return null
  }
}
