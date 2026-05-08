const SESSION_CACHE_KEY = 'flymacro_session_v2'
export const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export interface CachedUser {
  id: string | number
  credits?: number
  role?: string
}

export function readSessionCache(): { user: CachedUser | null; unread?: number; ts: number } | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { user: CachedUser | null; unread?: number; ts: number }
    return { user: parsed.user, unread: parsed.unread, ts: parsed.ts }
  } catch {
    return null
  }
}

export function writeSessionCache(user: CachedUser | null, opts?: { unread?: number }) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user, unread: opts?.unread ?? 0, ts: Date.now() }))
  } catch {}
}

export function isCacheValid(ts: number): boolean {
  return Date.now() - ts < CACHE_TTL_MS
}

export function clearSessionCache() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_CACHE_KEY)
  } catch {}
}
