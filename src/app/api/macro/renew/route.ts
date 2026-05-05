import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import type { User } from '../../../../payload-types'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  console.log('[renew] user:', user ? { id: user.id, email: user.email } : null)

  if (!user) {
    return NextResponse.json({ error: 'unauthenticated', message: '请先登录。' }, { status: 401 })
  }

  const payload = await getPayload()

  let body: { exchangeId?: number | string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid-body', message: '请求体格式错误。' }, { status: 400 })
  }

  const { exchangeId } = body
  if (!exchangeId) {
    return NextResponse.json({ error: 'missing-exchange', message: '缺少兑换记录标识。' }, { status: 400 })
  }

  const exchange = await payload.findByID({
    collection: 'macro-exchanges',
    id: exchangeId,
    depth: 1,
    overrideAccess: true,
  }).catch(() => null) as any

  if (!exchange) {
    return NextResponse.json({ error: 'exchange-not-found', message: '兑换记录不存在。' }, { status: 404 })
  }

  if (exchange.user !== user.id && !['super-admin', 'operator', 'support'].includes(user.role ?? '')) {
    return NextResponse.json({ error: 'forbidden', message: '无权操作此兑换记录。' }, { status: 403 })
  }

  const macro = typeof exchange.macro === 'number'
    ? await payload.findByID({ collection: 'macros', id: exchange.macro, depth: 0 }).catch(() => null)
    : exchange.macro

  if (!macro) {
    return NextResponse.json({ error: 'macro-not-found', message: '关联宏不存在。' }, { status: 404 })
  }

  const price = macro.price ?? 0
  const currentCredits = (user.credits as number) ?? 0

  if (currentCredits < price) {
    return NextResponse.json(
      { error: 'insufficient-credits', message: `积分不足，需要 ${price} 积分续费，当前 ${currentCredits} 积分。` },
      { status: 403 },
    )
  }

  const now = new Date()
  const baseTime = exchange.expiresAt && new Date(exchange.expiresAt) > now
    ? new Date(exchange.expiresAt)
    : now

  const durationDays = macro.durationDays ?? 0
  const newExpiresAt = durationDays > 0
    ? new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  // Deduct credits
  const newCredits = currentCredits - price
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { credits: newCredits } as any,
    overrideAccess: true,
  })

  // Update exchange
  await payload.update({
    collection: 'macro-exchanges',
    id: exchangeId,
    data: {
      expiresAt: newExpiresAt,
      revokedAt: null,
    } as any,
    overrideAccess: true,
  })

  // Create credit transaction
  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: user.id,
      amount: -price,
      balanceAfter: newCredits,
      type: 'renew',
      relatedExchange: exchangeId,
      reason: `续费「${macro.title}」`,
    } as any,
    overrideAccess: true,
  })

  return NextResponse.json({
    success: true,
    credits: newCredits,
    expiresAt: newExpiresAt,
  })
}
