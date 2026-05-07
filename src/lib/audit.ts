import type { PayloadRequest } from 'payload'

/**
 * Extract client IP from Payload request headers.
 */
export function getIPFromPayloadReq(req: PayloadRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP
  return 'unknown'
}

/**
 * Strip sensitive fields from a document before writing it to an audit log.
 */
export function sanitizeDoc(doc: unknown): Record<string, unknown> | null {
  if (!doc || typeof doc !== 'object') return null
  const clone = { ...(doc as Record<string, unknown>) }
  delete clone.password
  delete clone.salt
  delete clone.hash
  return clone
}
