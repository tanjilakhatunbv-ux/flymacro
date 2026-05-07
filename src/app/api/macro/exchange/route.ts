import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { success, unauthorized, badRequest, notFound, forbidden, conflict, internalError } from '../../../../lib/api-response'
import type { Macro } from '../../../../payload-types'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized('unauthenticated')
    }

    const payload = await getPayload()

    let body: { macroSlug?: string }
    try {
      body = (await req.json()) as typeof body
    } catch {
      return badRequest('请求体格式错误', 'invalid-body')
    }

    const { macroSlug } = body
    if (!macroSlug) {
      return badRequest('缺少宏标识', 'missing-macro')
    }

    const macroRes = await payload.find({
      collection: 'macros',
      where: { slug: { equals: macroSlug } },
      limit: 1,
      depth: 0,
    })
    const macro = macroRes.docs[0] as Macro | undefined

    if (!macro) {
      return notFound('macro-not-found')
    }

    const price = macro.price ?? 0
    const currentCredits = user.credits ?? 0

    if (currentCredits < price) {
      return forbidden(
        `积分不足，需要 ${price} 积分，当前 ${currentCredits} 积分`,
        'insufficient-credits',
      )
    }

    // Check for existing active exchange
    const existing = await payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { user: { equals: user.id } },
          { macro: { equals: macro.id } },
          {
            or: [
              { expiresAt: { exists: false } },
              { expiresAt: { greater_than_equal: new Date().toISOString() } },
            ],
          },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      return conflict('你已经兑换过此宏，且仍在有效期内', 'already-exchanged')
    }

    const now = new Date()
    const durationDays = macro.durationDays ?? 0
    const expiresAt = durationDays > 0
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Deduct credits
    const newCredits = currentCredits - price
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { credits: newCredits },
      overrideAccess: true,
    })

    // Create exchange record
    const exchange = await payload.create({
      collection: 'macro-exchanges',
      data: {
        user: user.id,
        macro: macro.id,
        creditsSpent: price,
        grantedAt: now.toISOString(),
        expiresAt,
        autoRenew: macro.autoRenewable ?? false,
      },
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
        reason: `兑换「${macro.title}」`,
      },
      overrideAccess: true,
    })

    // Create notification
    await payload.create({
      collection: 'notifications',
      data: {
        recipient: user.id,
        title: '兑换成功',
        body: `你已成功兑换「${macro.title}」，花费 ${price} 积分。${expiresAt ? '有效期至 ' + expiresAt.slice(0, 10) : '永久有效'}。`,
        link: `/macros/${macroSlug}`,
        category: 'order',
        read: false,
      },
      overrideAccess: true,
    })

    return NextResponse.json(success({
      credits: newCredits,
      expiresAt,
      autoRenew: macro.autoRenewable ?? false,
    }))
  } catch (_err) {
    return internalError('服务器内部错误')
  }
}
