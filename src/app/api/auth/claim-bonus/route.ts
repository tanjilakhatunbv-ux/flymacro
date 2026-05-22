import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { grantRegisterBonus } from '../../../../lib/register-bonus'
import { success, badRequest } from '../../../../lib/api-response'

/**
 * Called after email verification to award registration bonus.
 * Requires a valid verification token to prevent unauthorized claims.
 */
export async function POST(req: Request) {
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

  return NextResponse.json(success({ ok: true, credits: 20 }))
}
