import { headers as nextHeaders, cookies } from 'next/headers'
import { getPayload } from './payload'
import type { User } from '../payload-types'

/**
 * Resolves the currently authenticated user from the Next.js request headers
 * (which carry the Payload auth cookie). Returns null if not logged in.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const payload = await getPayload()
    const h = await nextHeaders()

    // Diagnostic logging: always log in production for now
    const cookieHeader = h.get('cookie')
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('payload-token')
    console.log('[getCurrentUser] cookie header present:', !!cookieHeader)
    console.log('[getCurrentUser] payload-token cookie present:', !!tokenCookie)
    if (tokenCookie) {
      console.log('[getCurrentUser] token preview:', tokenCookie.value.slice(0, 20) + '...')
    }

    const auth = await payload.auth({ headers: h })
    const user = auth.user as User | undefined
    console.log('[getCurrentUser] auth result:', user ? { id: user.id, email: user.email, role: user.role } : null)
    return user ?? null
  } catch (err) {
    console.error('[getCurrentUser] ERROR:', err instanceof Error ? err.message : String(err))
    if (err instanceof Error && err.stack) {
      console.error('[getCurrentUser] stack:', err.stack)
    }
    return null
  }
}

export function isStaffRole(user: User | null): boolean {
  if (!user) return false
  return user.role === 'super-admin' || user.role === 'operator' || user.role === 'support'
}
