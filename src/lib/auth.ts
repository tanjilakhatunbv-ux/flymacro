import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { getPayload } from './payload'
import { verifyJwt } from './jwt'
import type { User } from '../payload-types'

function getCandidateSecrets(payload: { config?: { secret?: string }; secret?: string }): string[] {
  const raw = payload.config?.secret
  const hashed = raw
    ? createHash('sha256').update(raw).digest('hex').slice(0, 32)
    : null
  const instance = payload.secret

  const candidates = new Set<string>()
  if (raw) candidates.add(raw)
  if (hashed) candidates.add(hashed)
  if (instance && typeof instance === 'string') candidates.add(instance)
  return Array.from(candidates)
}

/**
 * Resolves the currently authenticated user from the Payload auth cookie.
 * Bypasses payload.auth() which may fail silently in certain Vercel / Payload 3
 * configurations, and instead manually verifies the JWT + queries the DB.
 *
 * Suspended or banned users are treated as unauthenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const payload = await getPayload()
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('payload-token')

    if (!tokenCookie?.value) return null

    const candidates = getCandidateSecrets(payload)

    let jwtResult: { valid: boolean; payload: Record<string, unknown>; expired: boolean } | null = null
    for (const secret of candidates) {
      const result = verifyJwt(tokenCookie.value, secret)
      if (result.valid && !result.expired) {
        jwtResult = result
        break
      }
    }

    if (!jwtResult) return null

    const userId = jwtResult.payload?.id
    if (!userId || typeof userId !== 'number') return null

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })

    const userDoc = user as User | undefined
    if (!userDoc) return null

    // Reject suspended or banned users
    if (userDoc.status !== 'active') return null

    return userDoc
  } catch {
    return null
  }
}

export function isStaffRole(user: User | null): boolean {
  if (!user) return false
  return user.role === 'admin' || user.role === 'operator'
}
