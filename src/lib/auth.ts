import { cookies } from 'next/headers'
import { createHmac, createHash } from 'crypto'
import { getPayload } from './payload'
import type { User } from '../payload-types'

function base64UrlDecode(str: string) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = 4 - (padded.length % 4)
  const base64 = padding !== 4 ? padded + '='.repeat(padding) : padded
  return Buffer.from(base64, 'base64').toString('utf8')
}

function verifyJwt(token: string, secret: string): { valid: boolean; payload: any; expired: boolean } {
  const [headerB64, payloadB64, signatureB64] = token.split('.')
  const signingInput = `${headerB64}.${payloadB64}`
  const expectedSig = createHmac('sha256', secret).update(signingInput).digest('base64url')
  const payload = JSON.parse(base64UrlDecode(payloadB64))
  const now = Math.floor(Date.now() / 1000)
  const expired = payload.exp ? payload.exp < now : false
  return { valid: signatureB64 === expectedSig, payload, expired }
}

function getCandidateSecrets(payload: any): string[] {
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
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const payload = await getPayload()
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('payload-token')

    console.log('[getCurrentUser] cookie present:', !!tokenCookie)
    if (!tokenCookie?.value) return null

    const candidates = getCandidateSecrets(payload)
    console.log('[getCurrentUser] trying', candidates.length, 'secret candidates')

    let jwtResult: { valid: boolean; payload: any; expired: boolean } | null = null
    for (const secret of candidates) {
      const result = verifyJwt(tokenCookie.value, secret)
      if (result.valid && !result.expired) {
        jwtResult = result
        console.log('[getCurrentUser] jwt verified with candidate prefix:', secret.slice(0, 10))
        break
      }
    }

    if (!jwtResult) {
      console.log('[getCurrentUser] jwt invalid or expired for all', candidates.length, 'candidates')
      return null
    }

    const userId = jwtResult.payload?.id
    if (!userId) {
      console.log('[getCurrentUser] no user id in jwt')
      return null
    }

    // Direct DB lookup
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })

    console.log('[getCurrentUser] db lookup:', user ? { id: (user as any).id, email: (user as any).email } : null)
    return (user as User | undefined) ?? null
  } catch (err) {
    console.error('[getCurrentUser] ERROR:', err instanceof Error ? err.message : String(err))
    return null
  }
}

export function isStaffRole(user: User | null): boolean {
  if (!user) return false
  return user.role === 'super-admin' || user.role === 'operator' || user.role === 'support'
}
