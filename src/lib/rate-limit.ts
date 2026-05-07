type RateLimitEntry = { count: number; resetAt: number }

const store = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory rate limiter for serverless environments (Vercel).
 * NOT suitable for multi-instance deployments — use Redis for production scale.
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

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP
  return 'unknown'
}
