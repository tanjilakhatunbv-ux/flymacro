import { Redis } from '@upstash/redis'

type RateLimitEntry = { count: number; resetAt: number }

const store = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory rate limiter.
 * NOT suitable for multi-instance deployments — use rateLimitWithFallback instead.
 */
export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.max - 1, resetAt: now + opts.windowMs }
  }

  if (entry.count >= opts.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: opts.max - entry.count, resetAt: entry.resetAt }
}

/**
 * Multi-window rate limiter with Redis fallback.
 * Uses Upstash Redis when configured, falls back to in-memory.
 * Supports multiple windows for the same key (e.g., per-minute + per-hour).
 */
export async function rateLimitWithFallback(
  key: string,
  windows: Array<{ max: number; windowMs: number }>,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    return rateLimitRedis(key, windows, redisUrl, redisToken)
  }

  // Fallback to in-memory — check all windows
  let minRemaining = Infinity
  let latestResetAt = 0
  for (const w of windows) {
    const result = rateLimit(`${key}:${w.windowMs}`, w)
    minRemaining = Math.min(minRemaining, result.remaining)
    latestResetAt = Math.max(latestResetAt, result.resetAt)
    if (!result.allowed) {
      return { allowed: false, remaining: 0, resetAt: result.resetAt }
    }
  }
  return { allowed: true, remaining: minRemaining, resetAt: latestResetAt }
}

async function rateLimitRedis(
  key: string,
  windows: Array<{ max: number; windowMs: number }>,
  url: string,
  token: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const redis = new Redis({ url, token })

    for (const w of windows) {
      const redisKey = `rl:${key}:${w.windowMs}`
      const now = Date.now()
      const windowStart = now - (now % w.windowMs)
      const ttl = Math.ceil(w.windowMs / 1000)

      const count = await redis.incr(redisKey) as number
      if (count === 1) {
        await redis.expire(redisKey, ttl)
      }

      if (count > w.max) {
        const ttlRem = await redis.ttl(redisKey) as number
        return { allowed: false, remaining: 0, resetAt: now + ttlRem * 1000 }
      }
    }

    return { allowed: true, remaining: 1, resetAt: Date.now() + windows[0].windowMs }
  } catch {
    // Redis error — fallback to in-memory
    let minRemaining = Infinity
    let latestResetAt = 0
    for (const w of windows) {
      const result = rateLimit(`${key}:${w.windowMs}`, w)
      minRemaining = Math.min(minRemaining, result.remaining)
      latestResetAt = Math.max(latestResetAt, result.resetAt)
      if (!result.allowed) {
        return { allowed: false, remaining: 0, resetAt: result.resetAt }
      }
    }
    return { allowed: true, remaining: minRemaining, resetAt: latestResetAt }
  }
}

/**
 * Get a counter value (for login failure tracking etc.)
 * Uses Redis when available, falls back to in-memory.
 */
export async function getCount(key: string): Promise<number> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    try {
      const redis = new Redis({ url: redisUrl, token: redisToken })
      const val = await redis.get(`cnt:${key}`)
      return typeof val === 'number' ? val : parseInt(String(val ?? '0'), 10) || 0
    } catch {
      // fall through to in-memory
    }
  }

  const entry = store.get(`cnt:${key}`)
  if (!entry) return 0
  if (Date.now() > entry.resetAt) {
    store.delete(`cnt:${key}`)
    return 0
  }
  return entry.count
}

/**
 * Increment a counter with TTL in seconds.
 * Uses Redis when available, falls back to in-memory.
 */
export async function incr(key: string, ttlSeconds: number): Promise<void> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    try {
      const redis = new Redis({ url: redisUrl, token: redisToken })
      const redisKey = `cnt:${key}`
      const count = await redis.incr(redisKey) as number
      if (count === 1) {
        await redis.expire(redisKey, ttlSeconds)
      }
      return
    } catch {
      // fall through to in-memory
    }
  }

  const memKey = `cnt:${key}`
  const now = Date.now()
  const entry = store.get(memKey)
  if (!entry || now > entry.resetAt) {
    store.set(memKey, { count: 1, resetAt: now + ttlSeconds * 1000 })
  } else {
    entry.count++
  }
}

/**
 * Delete one or more counters.
 */
export async function del(...keys: string[]): Promise<void> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    try {
      const redis = new Redis({ url: redisUrl, token: redisToken })
      if (keys.length > 0) {
        await redis.del(...keys.map((k) => `cnt:${k}`))
      }
      return
    } catch {
      // fall through to in-memory
    }
  }

  for (const k of keys) {
    store.delete(`cnt:${k}`)
  }
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP
  return 'unknown'
}
