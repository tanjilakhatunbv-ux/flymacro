import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { grantRegisterBonus } from '../../../../lib/register-bonus'
import { success, badRequest } from '../../../../lib/api-response'
import { writeAuditLog } from '../../../../lib/audit'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'

/**
 * Called after email verification to award registration bonus.
 * Requires a valid verification token to prevent unauthorized claims.
 */
export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`claim:${ip}`, [
    { max: 3, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁', code: 'rate_limited' },
      { status: 429 },
    )
  }

  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid_json')
  }

  const token = body.token
  if (!token) {
    return badRequest('缺少 token', 'missing_token')
  }

  const payload = await getPayload()

  // Token-only lookup — ensures caller actually completed email verification
  const byToken = await payload.find({
    collection: 'users',
    where: {
      _verificationToken: { equals: token },
      _verified: { equals: true },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (byToken.docs.length === 0) {
    return badRequest('无效的验证信息', 'invalid_token')
  }

  const user = byToken.docs[0]

  // Already has credits — already claimed or set at registration
  if ((user.credits ?? 0) > 0) {
    return NextResponse.json(success({ ok: true, message: 'already_claimed' }))
  }

  // Award registration bonus
  await grantRegisterBonus(user)

  writeAuditLog({
    action: 'claim_bonus',
    collection: 'users',
    docId: String(user.id),
    operator: user.id,
    ip: getClientIP(req),
    reason: '邮箱验证后领取注册奖励',
  })

  return NextResponse.json(success({ ok: true, credits: 20 }))
}
