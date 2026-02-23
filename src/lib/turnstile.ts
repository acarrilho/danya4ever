/**
 * Server-side Cloudflare Turnstile verification.
 * Never expose TURNSTILE_SECRET_KEY to the client.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) throw new Error('TURNSTILE_SECRET_KEY is not set')

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  })

  if (!res.ok) return false

  const data = (await res.json()) as { success: boolean }
  return data.success === true
}
