import type { PayloadRequest } from 'payload'

export function getIPFromPayloadReq(req: PayloadRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP
  return 'unknown'
}

export function sanitizeDoc(doc: unknown): Record<string, unknown> | null {
  if (!doc || typeof doc !== 'object') return null
  const clone = { ...(doc as Record<string, unknown>) }
  delete clone.password
  delete clone.salt
  delete clone.hash
  return clone
}

type AuditAction =
  | 'create_user' | 'update_user' | 'delete_user'
  | 'create_ticket' | 'update_ticket' | 'delete_ticket'
  | 'create_order' | 'update_order' | 'delete_order'
  | 'adjust_credits' | 'change_status' | 'reset_password'
  | 'change_password' | 'register' | 'login_success'
  | 'login_failed' | 'resend_verification' | 'bulk_action'
  | 'logout' | 'exchange' | 'renew' | 'claim_bonus'
  | 'payment_received' | 'oauth_login' | 'auto_renew'
  | 'other'

interface AuditLogEntry {
  action: AuditAction
  collection?: string
  docId?: string
  operator?: string | number
  ip?: string
  reason?: string
  metadata?: Record<string, unknown>
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const { getPayload } = await import('./payload')
    const payload = await getPayload()
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: entry.action as 'other',
        collection: entry.collection ?? 'system',
        docId: entry.docId ?? '',
        operator: (typeof entry.operator === 'string' ? Number(entry.operator) : entry.operator) ?? 0,
        ip: entry.ip ?? 'unknown',
        reason: entry.reason ?? '',
        metadata: entry.metadata ?? {},
      },
      overrideAccess: true,
    })
  } catch {
    /* audit log failures should never break the main flow */
  }
}
