import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { success, badRequest } from '../../../../lib/api-response'

/**
 * Called after email verification to award registration bonus.
 * The VerifyEmailRunner calls this with the token used for verification,
 * which we can use to look up the user.
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

  // Find user by verification token
  const users = await payload.find({
    collection: 'users',
    where: {
      _verificationToken: { equals: token },
      _verified: { equals: true },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (users.docs.length === 0) {
    return badRequest('无效的验证信息', 'invalid_token')
  }

  const user = users.docs[0]

  // Already has credits — already claimed
  if ((user.credits ?? 0) > 0) {
    return NextResponse.json(success({ ok: true, message: 'already_claimed' }))
  }

  // Award registration bonus
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { credits: 20 } as never,
    overrideAccess: true,
  })

  try {
    await payload.create({
      collection: 'credit-transactions',
      data: {
        user: user.id,
        amount: 20,
        balanceAfter: 20,
        type: 'register_bonus',
        reason: '新用户注册奖励（邮箱验证后发放）',
      },
      overrideAccess: true,
    })
  } catch {
    /* ignore credit transaction failure */
  }

  return NextResponse.json(success({ ok: true, credits: 20 }))
}
