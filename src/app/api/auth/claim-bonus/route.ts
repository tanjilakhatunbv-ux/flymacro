import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { grantRegisterBonus } from '../../../../lib/register-bonus'
import { success, badRequest } from '../../../../lib/api-response'

/**
 * Called after email verification to award registration bonus.
 * Accepts email (preferred) or token. PayloadCMS clears _verificationToken
 * after successful verification, so email is the reliable identifier.
 */
export async function POST(req: Request) {
  let body: { email?: string; token?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid_json')
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const token = body.token

  if (!email && !token) {
    return badRequest('缺少 email 或 token', 'missing_identifier')
  }

  const payload = await getPayload()

  let user = null

  if (email) {
    const byEmail = await payload.find({
      collection: 'users',
      where: {
        email: { equals: email },
        _verified: { equals: true },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (byEmail.docs.length > 0) user = byEmail.docs[0]
  }

  // Fallback to token (for backwards compatibility)
  if (!user && token) {
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
    if (byToken.docs.length > 0) user = byToken.docs[0]
  }

  if (!user) {
    return badRequest('无效的验证信息', 'invalid_identifier')
  }

  // Already has credits — already claimed or set at registration
  if ((user.credits ?? 0) > 0) {
    return NextResponse.json(success({ ok: true, message: 'already_claimed' }))
  }

  // Award registration bonus
  await grantRegisterBonus(user)

  return NextResponse.json(success({ ok: true, credits: 20 }))
}
