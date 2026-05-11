import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { success, unauthorized, badRequest, notFound, forbidden, internalError } from '../../../../lib/api-response'
import type { Macro, MacroExchange } from '../../../../payload-types'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized('unauthenticated')
    }

    const payload = await getPayload()

    let body: { exchangeId?: number | string }
    try {
      body = (await req.json()) as typeof body
    } catch {
      return badRequest('请求体格式错误', 'invalid-body')
    }

    const { exchangeId } = body
    if (!exchangeId) {
      return badRequest('缺少兑换记录标识', 'missing-exchange')
    }

    const exchange = await payload
      .findByID({
        collection: 'macro-exchanges',
        id: exchangeId,
        depth: 1,
      })
      .catch(() => null) as MacroExchange | null

    if (!exchange) {
      return notFound('exchange-not-found')
    }

    const ownerId = typeof exchange.user === 'object' ? exchange.user.id : exchange.user
    if (ownerId !== user.id && !['admin', 'operator'].includes(user.role ?? '')) {
      return forbidden('无权操作此兑换记录', 'forbidden')
    }

    const macro =
      typeof exchange.macro === 'number'
        ? ((await payload
            .findByID({ collection: 'macros', id: exchange.macro, depth: 0 })
            .catch(() => null)) as Macro | null)
        : (exchange.macro as Macro | null)

    if (!macro) {
      return notFound('macro-not-found')
    }

    const price = macro.price ?? 0
    const currentCredits = user.credits ?? 0

    if (currentCredits < price) {
      return forbidden(
        `积分不足，需要 ${price} 积分续费，当前 ${currentCredits} 积分`,
        'insufficient-credits',
      )
    }

    const now = new Date()
    const baseTime =
      exchange.expiresAt && new Date(exchange.expiresAt) > now
        ? new Date(exchange.expiresAt)
        : now

    const durationDays = macro.durationDays ?? 0
    const newExpiresAt =
      durationDays > 0
        ? new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null

    // Deduct credits
    const newCredits = currentCredits - price
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { credits: newCredits },
      overrideAccess: true,
    })

    // Update exchange
    await payload.update({
      collection: 'macro-exchanges',
      id: exchangeId,
      data: {
        expiresAt: newExpiresAt,
        revokedAt: null,
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
        type: 'renew',
        relatedExchange: Number(exchangeId),
        reason: `续费「${macro.title}」`,
      },
      overrideAccess: true,
    })

    return NextResponse.json(success({ credits: newCredits, expiresAt: newExpiresAt }))
  } catch (_err) {
    return internalError('服务器内部错误')
  }
}
