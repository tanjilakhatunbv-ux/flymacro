import { cookies } from 'next/headers'
import { getPayload } from './payload'
import { verifyJwt } from './jwt'
import { createHash } from 'crypto'
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

type AdminUser = User & { role: 'admin' | 'operator' }

export async function requireAdmin(): Promise<{ user: AdminUser; payload: Awaited<ReturnType<typeof getPayload>> } | { error: string; status: number }> {
  try {
    const payload = await getPayload()
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('payload-token')

    if (!tokenCookie?.value) return { error: '未登录', status: 401 }

    const candidates = getCandidateSecrets(payload)

    let userId: number | null = null
    for (const secret of candidates) {
      const result = verifyJwt(tokenCookie.value, secret)
      if (result.valid && !result.expired) {
        const id = result.payload?.id
        if (typeof id === 'number') { userId = id; break }
      }
    }

    if (!userId) return { error: '登录已过期', status: 401 }

    const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 }) as User

    if (!user || user.status !== 'active') return { error: '账号状态异常', status: 403 }
    if (user.role !== 'admin' && user.role !== 'operator') return { error: '权限不足', status: 403 }

    return { user: user as AdminUser, payload }
  } catch {
    return { error: '鉴权失败', status: 500 }
  }
}
