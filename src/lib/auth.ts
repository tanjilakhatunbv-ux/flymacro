import { cookies } from 'next/headers'
import { getPayload } from './payload'
import type { User } from '../payload-types'

/**
 * Resolves the currently authenticated user from the Payload auth cookie.
 * Uses the Next.js cookies() API (more reliable than headers() in Server Components
 * on Vercel) and constructs a minimal Headers object for payload.auth().
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const payload = await getPayload()
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('payload-token')

    console.log('[getCurrentUser] payload-token cookie present:', !!tokenCookie)
    if (tokenCookie) {
      console.log('[getCurrentUser] token preview:', tokenCookie.value.slice(0, 20) + '...')
    }

    if (!tokenCookie?.value) {
      console.log('[getCurrentUser] no token cookie — returning null')
      return null
    }

    // Construct a clean Headers object with only the auth cookie.
    // This avoids any issues with ReadonlyHeaders from nextHeaders().
    const headers = new Headers()
    headers.set('cookie', `payload-token=${tokenCookie.value}`)

    const auth = await payload.auth({ headers })
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
