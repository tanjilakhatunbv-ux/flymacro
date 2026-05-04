import { headers as nextHeaders } from 'next/headers'
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
    const auth = await payload.auth({ headers: h })
    return (auth.user as User | undefined) ?? null
  } catch {
    return null
  }
}

export function isStaffRole(user: User | null): boolean {
  if (!user) return false
  return user.role === 'super-admin' || user.role === 'operator' || user.role === 'support'
}
