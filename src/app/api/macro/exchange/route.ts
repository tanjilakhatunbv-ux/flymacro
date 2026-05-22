import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { success, unauthorized, badRequest, notFound, forbidden, conflict, internalError } from '../../../../lib/api-response'
import { writeAuditLog } from '../../../../lib/audit'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import type { Macro } from '../../../../payload-types'
import { sql } from '@payloadcms/db-postgres'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`exchange:${ip}`, [
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

    if (price === 0) {
      return badRequest('该宏无法兑换', 'invalid-macro')
    }

    // Wrap duplicate check + credit deduction in a transaction to close the race window
    let newCredits: number
    let exchangeAlreadyExists: boolean

    await payload.db.drizzle.execute(
      sql`BEGIN`
    )

    try {
      // Check for existing active exchange within transaction
      const existingRes = await payload.db.drizzle.execute(
        sql`SELECT id FROM macro_exchanges WHERE user_id = ${user.id} AND macro_id = ${macro.id} AND (expires_at IS NULL OR expires_at >= NOW()) LIMIT 1`
      )
      const existingRows = existingRes.rows as Array<{ id: number }> | undefined
      exchangeAlreadyExists = !!(existingRows && existingRows.length > 0)

      if (exchangeAlreadyExists) {
        await payload.db.drizzle.execute(sql`ROLLBACK`)
        return conflict('你已经兑换过此宏，且仍在有效期内', 'already-exchanged')
      }

      // Atomic credit deduction
      const result = await payload.db.drizzle.execute(
        sql`UPDATE users SET credits = credits - ${price} WHERE id = ${user.id} AND credits >= ${price} RETURNING credits`
      )
      const rows = result.rows as Array<{ credits: number }> | undefined
      if (!rows || rows.length === 0) {
        await payload.db.drizzle.execute(sql`ROLLBACK`)
        return forbidden(
          `积分不足，需要 ${price} 积分`,
          'insufficient-credits',
        )
      }
      newCredits = rows[0].credits

      await payload.db.drizzle.execute(sql`COMMIT`)
    } catch (txErr) {
      await payload.db.drizzle.execute(sql`ROLLBACK`).catch(() => {})
      throw txErr
    }

    const now = new Date()
    const durationDays = macro.durationDays ?? 0
    const expiresAt = durationDays > 0
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null

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

    writeAuditLog({
      action: 'exchange',
      collection: 'macros',
      docId: String(macro.id),
      operator: user.id,
      ip: getClientIP(req),
      reason: `兑换「${macro.title}」花费 ${price} 积分`,
      metadata: { credits: newCredits, exchangeId: exchange.id },
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
