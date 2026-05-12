import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { badRequest, internalError } from '../../../../lib/api-response'
import { validatePasswordStrength } from '../../../../lib/validation'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`reset:${ip}`, [
    { max: 5, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁，请稍后再试', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { token?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid_json')
  }

  const { token, password } = body
  if (!token || !password) {
    return badRequest('缺少必要参数', 'missing_params')
  }

  const strength = validatePasswordStrength(password)
  if (!strength.ok) {
    return badRequest(strength.error, 'password_weak')
  }

  const payload = await getPayload()

  // Find the user by reset token to check password reuse
  const now = new Date().toISOString()
  const users = await payload.find({
    collection: 'users',
    where: {
      resetPasswordToken: { equals: token },
      resetPasswordExpiration: { greater_than: now },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (users.docs.length === 0) {
    return badRequest('Token 无效或已过期', 'invalid_token')
  }

  const user = users.docs[0] as { id: number; email: string; hash?: string; salt?: string }

  // Check if new password matches the old one
  if (user.hash && user.salt) {
    const { scrypt } = await import('crypto')
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, user.salt as string, 64, (err, key) => {
        if (err) reject(err)
        else resolve(key)
      })
    })
    if (derivedKey.toString('hex') === user.hash) {
      return badRequest('新密码不能与当前密码相同', 'password_reuse')
    }
  }

  // Perform the actual reset via Payload
  try {
    await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '密码重置失败'
    if (msg.includes('invalid') || msg.includes('expired') || msg.includes('Token')) {
      return badRequest('Token 无效或已过期', 'invalid_token')
    }
    return internalError(msg)
  }

  // Audit log for self-service password reset
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'reset_password',
        collection: 'users',
        docId: String(user.id),
        operator: user.id,
        ip,
        reason: '用户自助重置密码',
      },
      overrideAccess: true,
    })
  } catch {
    /* audit log failure must not block password reset */
  }

  return NextResponse.json({ success: true, data: { ok: true } })
}
