import { Redis } from '@upstash/redis'
import type { User } from '../payload-types'

const USER_CACHE_TTL = 300 // 5 minutes in seconds
const USER_CACHE_PREFIX = 'user:'

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export async function getCachedUser(userId: number): Promise<User | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const cached = await redis.get<User>(`${USER_CACHE_PREFIX}${userId}`)
    if (cached) return cached
  } catch {
    // Redis failure — fall through
  }
  return null
}

export async function setCachedUser(user: User): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.setex(`${USER_CACHE_PREFIX}${user.id}`, USER_CACHE_TTL, user)
  } catch {
    // ignore cache write failures
  }
}

export async function invalidateUserCache(userId: number | string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(`${USER_CACHE_PREFIX}${userId}`)
  } catch {
    // ignore
  }
}
