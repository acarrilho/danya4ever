import { randomBytes } from 'crypto'

/**
 * Generates a cryptographically secure random token for moderation links.
 * 32 bytes = 64 hex chars — effectively unguessable.
 */
export function generateModerationToken(): string {
  return randomBytes(32).toString('hex')
}
