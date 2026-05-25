import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { getCurrentUser } from '../../../lib/auth'
import { getPayload } from '../../../lib/payload'
import { badRequest, conflict, internalError, notFound, success, unauthorized } from '../../../lib/api-response'
import {
  assertRedeemCodeMatchesCredits,
  normalizeRedeemCode,
} from '../../../lib/redeem-code-rules'
import { getClientIP, rateLimitWithFallback } from '../../../lib/rate-limit'
import { writeAuditLog } from '../../../lib/audit'

type RedeemCodeRow = {
  id: number
  code: string
  credits_granted: string | number
  max_redemptions: string | number
  redeemed_count: string | number
  enabled: boolean
}

type UserCreditRow = {
  credits: number
}

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`redeem-code:${ip}`, [
    { max: 8, windowMs: 60_000 },
    { max: 30, windowMs: 3_600_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁', code: 'rate_limited' },
      { status: 429 },
    )
  }

  const user = await getCurrentUser()
  if (!user) return unauthorized('请先登录', 'unauthenticated')

  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid_body')
  }

  const code = normalizeRedeemCode(body.code ?? '')
  if (!code) return badRequest('请输入兑换码', 'missing_redeem_code')

  const payload = await getPayload()
  let redemptionId: number | string | null = null
  let redeemCodeId: number | null = null
  let creditsGranted = 0
  let balanceBefore = Number(user.credits ?? 0)
  let balanceAfter = balanceBefore

  await payload.db.drizzle.execute(sql`BEGIN`)

  try {
    const codeResult = await payload.db.drizzle.execute(sql`
      SELECT id, code, credits_granted, max_redemptions, redeemed_count, enabled
      FROM redeem_codes
      WHERE code = ${code}
      FOR UPDATE
      LIMIT 1
    `)
    const rows = codeResult.rows as RedeemCodeRow[] | undefined
    const redeemCode = rows?.[0]

    if (!redeemCode) {
      await payload.db.drizzle.execute(sql`ROLLBACK`)
      return notFound('兑换码不存在', 'redeem_code_not_found')
    }

    if (!redeemCode.enabled) {
      await payload.db.drizzle.execute(sql`ROLLBACK`)
      return conflict('兑换码已停用', 'redeem_code_disabled')
    }

    creditsGranted = Number(redeemCode.credits_granted)
    assertRedeemCodeMatchesCredits(redeemCode.code, creditsGranted)

    const maxRedemptions = Number(redeemCode.max_redemptions)
    const redeemedCount = Number(redeemCode.redeemed_count)
    if (redeemedCount >= maxRedemptions) {
      await payload.db.drizzle.execute(sql`ROLLBACK`)
      return conflict('兑换码已用完', 'redeem_code_exhausted')
    }

    const userResult = await payload.db.drizzle.execute(sql`
      SELECT credits
      FROM users
      WHERE id = ${user.id}
      FOR UPDATE
      LIMIT 1
    `)
    const userRows = userResult.rows as UserCreditRow[] | undefined
    balanceBefore = Number(userRows?.[0]?.credits ?? user.credits ?? 0)

    const creditResult = await payload.db.drizzle.execute(sql`
      UPDATE users
      SET credits = credits + ${creditsGranted}
      WHERE id = ${user.id}
      RETURNING credits
    `)
    const creditRows = creditResult.rows as UserCreditRow[] | undefined
    balanceAfter = Number(creditRows?.[0]?.credits ?? balanceBefore + creditsGranted)

    await payload.db.drizzle.execute(sql`
      UPDATE redeem_codes
      SET redeemed_count = redeemed_count + 1, updated_at = now()
      WHERE id = ${redeemCode.id}
    `)

    const redemption = await payload.create({
      collection: 'redeem-code-redemptions',
      data: {
        user: user.id,
        redeemCode: redeemCode.id,
        creditsGranted,
        balanceBefore,
        balanceAfter,
      },
      overrideAccess: true,
    })
    redemptionId = redemption.id
    redeemCodeId = redeemCode.id

    await payload.create({
      collection: 'credit-transactions',
      data: {
        user: user.id,
        amount: creditsGranted,
        balanceAfter,
        type: 'redeem_code',
        reason: `兑换码 ${code} 兑换 ${creditsGranted} 点券`,
      },
      overrideAccess: true,
    })

    await payload.db.drizzle.execute(sql`COMMIT`)
  } catch (err) {
    await payload.db.drizzle.execute(sql`ROLLBACK`).catch(() => {})
    const message = err instanceof Error ? err.message : '兑换失败'
    return internalError(message, 'redeem_code_failed')
  }

  writeAuditLog({
    action: 'other',
    collection: 'redeem-codes',
    docId: redeemCodeId ? String(redeemCodeId) : undefined,
    operator: user.id,
    ip,
    reason: `兑换码兑换 ${creditsGranted} 点券`,
    metadata: { redemptionId, creditsGranted, balanceBefore, balanceAfter },
  })

  return NextResponse.json(success({ creditsGranted, balanceBefore, balanceAfter }))
}
