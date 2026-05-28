import { sql } from '@payloadcms/db-postgres'
import { getPayload } from './payload'
import {
  assertRedeemCodeMatchesCredits,
  normalizeRedeemCode,
} from './redeem-code-rules'
import type { User } from '../payload-types'

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

export type RedeemCodeResult = {
  creditsGranted: number
  balanceBefore: number
  balanceAfter: number
  redeemCodeId: number | null
  redemptionId: number | string | null
}

export type RedeemCodeFailureCode =
  | 'redeem_code_not_found'
  | 'redeem_code_disabled'
  | 'redeem_code_exhausted'
  | 'redeem_code_failed'

export class RedeemCodeError extends Error {
  constructor(
    message: string,
    public readonly code: RedeemCodeFailureCode,
  ) {
    super(message)
    this.name = 'RedeemCodeError'
  }
}

export async function redeemCodeForUser(user: User, rawCode: string): Promise<RedeemCodeResult> {
  const code = normalizeRedeemCode(rawCode)
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
      throw new RedeemCodeError('\u5151\u6362\u7801\u4e0d\u5b58\u5728', 'redeem_code_not_found')
    }

    if (!redeemCode.enabled) {
      throw new RedeemCodeError('\u5151\u6362\u7801\u5df2\u505c\u7528', 'redeem_code_disabled')
    }

    creditsGranted = Number(redeemCode.credits_granted)
    assertRedeemCodeMatchesCredits(redeemCode.code, creditsGranted)

    const maxRedemptions = Number(redeemCode.max_redemptions)
    const redeemedCount = Number(redeemCode.redeemed_count)
    if (redeemedCount >= maxRedemptions) {
      throw new RedeemCodeError('\u5151\u6362\u7801\u5df2\u7528\u5b8c', 'redeem_code_exhausted')
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
        reason: `\u5151\u6362\u7801 ${code} \u5151\u6362 ${creditsGranted} \u70b9\u5238`,
      },
      overrideAccess: true,
    })

    await payload.db.drizzle.execute(sql`COMMIT`)
    return { creditsGranted, balanceBefore, balanceAfter, redeemCodeId, redemptionId }
  } catch (err) {
    await payload.db.drizzle.execute(sql`ROLLBACK`).catch(() => {})
    if (err instanceof RedeemCodeError) throw err
    const message = err instanceof Error ? err.message : '\u5151\u6362\u5931\u8d25'
    throw new RedeemCodeError(message, 'redeem_code_failed')
  }
}
