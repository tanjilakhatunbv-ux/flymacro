import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { success, unauthorized, badRequest, notFound, forbidden, internalError } from '../../../../lib/api-response'
import { writeAuditLog } from '../../../../lib/audit'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { sql } from '@payloadcms/db-postgres'
import type { Macro, MacroExchange } from '../../../../payload-types'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`renew:${ip}`, [
    { max: 10, windowMs: 60_000 },
    { max: 50, windowMs: 3_600_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁', code: 'rate_limited' },
      { status: 429 },
    )
  }

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

    // Atomic credit deduction — same pattern as exchange endpoint
    const result = await payload.db.drizzle.execute(
      sql`UPDATE users SET credits = credits - ${price} WHERE id = ${user.id} AND credits >= ${price} RETURNING credits`
    )
    const rows = result.rows as Array<{ credits: number }> | undefined
    if (!rows || rows.length === 0) {
      return forbidden(
        `点券不足，需要 ${price} 点券续费`,
        'insufficient-credits',
      )
    }
    const newCredits = rows[0].credits

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

    writeAuditLog({
      action: 'renew',
      collection: 'macros',
      docId: String(macro.id),
      operator: user.id,
      ip: getClientIP(req),
      reason: `续费「${macro.title}」花费 ${price} 点券`,
      metadata: { credits: newCredits, exchangeId },
    })

    return NextResponse.json(success({ credits: newCredits, expiresAt: newExpiresAt }))
  } catch (_err) {
    return internalError('服务器内部错误')
  }
}
