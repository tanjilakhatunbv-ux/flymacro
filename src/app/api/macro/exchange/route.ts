import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated', message: '请先登录。' }, { status: 401 })
  }

  let body: { macroSlug?: string; modelIndex?: number }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid-body', message: '请求体格式错误。' }, { status: 400 })
  }

  const { macroSlug, modelIndex = 0 } = body
  if (!macroSlug) {
    return NextResponse.json({ error: 'missing-macro', message: '缺少宏标识。' }, { status: 400 })
  }

  const payload = await getPayload()

  const macroRes = await payload.find({
    collection: 'macros',
    where: { slug: { equals: macroSlug } },
    limit: 1,
    depth: 0,
  })
  const macro = macroRes.docs[0] as any
  if (!macro || macro.type !== 'premium') {
    return NextResponse.json({ error: 'macro-not-found', message: '宏不存在或不是付费宏。' }, { status: 404 })
  }

  const models = (macro.models ?? []) as Array<{
    name: string
    price: number
    tier: string
    durationDays: number
    autoRenewable?: boolean
  }>
  const model = models[modelIndex]
  if (!model) {
    return NextResponse.json({ error: 'model-not-found', message: '型号不存在。' }, { status: 404 })
  }

  const price = model.price
  const currentCredits = (user.credits as number) ?? 0

  if (currentCredits < price) {
    return NextResponse.json(
      { error: 'insufficient-credits', message: `积分不足，需要 ${price} 积分，当前 ${currentCredits} 积分。` },
      { status: 403 },
    )
  }

  // Check for existing active exchange
  const existing = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: user.id } },
        { macro: { equals: macro.id } },
        { modelName: { equals: model.name } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    const ex = existing.docs[0] as any
    const now = new Date()
    const expiresAt = ex.expiresAt ? new Date(ex.expiresAt) : null
    if (!expiresAt || expiresAt > now) {
      return NextResponse.json(
        { error: 'already-exchanged', message: '你已兑换过此型号，且仍在有效期内。' },
        { status: 409 },
      )
    }
  }

  const now = new Date()
  const expiresAt = model.durationDays > 0
    ? new Date(now.getTime() + model.durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  // Deduct credits
  const newCredits = currentCredits - price
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { credits: newCredits } as any,
    overrideAccess: true,
  })

  // Create exchange record
  const exchange = await payload.create({
    collection: 'macro-exchanges',
    data: {
      user: user.id,
      macro: macro.id,
      modelName: model.name,
      creditsSpent: price,
      grantedAt: now.toISOString(),
      expiresAt,
      autoRenew: model.autoRenewable ?? false,
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
      type: 'exchange',
      relatedExchange: exchange.id,
      reason: `兑换「${macro.title}」${model.name}`,
    } as any,
    overrideAccess: true,
  })

  // Create notification
  await payload.create({
    collection: 'notifications',
    data: {
      recipient: user.id,
      title: '兑换成功',
      body: `你已成功兑换「${macro.title}」${model.name}，花费 ${price} 积分。${expiresAt ? '有效期至 ' + expiresAt.slice(0, 10) : '永久有效'}。`,
      link: `/macros/${macroSlug}`,
      category: 'order',
      read: false,
    } as any,
    overrideAccess: true,
  })

  return NextResponse.json({
    success: true,
    credits: newCredits,
    expiresAt,
    autoRenew: model.autoRenewable ?? false,
  })
}
