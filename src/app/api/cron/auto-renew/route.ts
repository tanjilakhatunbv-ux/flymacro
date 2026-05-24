import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { env } from '../../../../lib/env'
import { unauthorized, success, internalError } from '../../../../lib/api-response'
import { writeAuditLog } from '../../../../lib/audit'
import { sql } from '@payloadcms/db-postgres'
import type { Macro, User } from '../../../../payload-types'

interface ExchangeDoc {
  id: number
  macro: number | Macro
  user: number | User
  expiresAt: string | null
  autoRenew: boolean
}

/**
 * Auto-renew cron job.
 * Should be called once per day (e.g. via Vercel Cron or external scheduler).
 * Renews macro-exchanges where autoRenew=true and expires within 24h.
 */
export async function GET(req: Request) {
  const secret = env.CRON_SECRET
  const url = new URL(req.url)
  const provided = url.searchParams.get('secret') || req.headers.get('x-cron-secret')

  if (!secret) {
    return unauthorized('cron_secret_not_configured')
  }

  if (provided !== secret) {
    return unauthorized('invalid_cron_secret')
  }

  try {
    const payload = await getPayload()
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const exchanges = await payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { autoRenew: { equals: true } },
          { expiresAt: { greater_than_equal: now.toISOString() } },
          { expiresAt: { less_than_equal: tomorrow.toISOString() } },
          { revokedAt: { exists: false } },
        ],
      },
      limit: 200,
      depth: 1,
      overrideAccess: true,
    })

    let renewed = 0
    let failed = 0

    for (const ex of exchanges.docs as ExchangeDoc[]) {
      // depth:1 populates macro and user, only fallback to findByID if needed
      const macroDoc = (typeof ex.macro === 'object' && ex.macro !== null ? ex.macro : null) as Macro | null
      if (!macroDoc) {
        failed++
        continue
      }

      const price = macroDoc.price ?? 0
      const durationDays = macroDoc.durationDays ?? 0
      const userId = typeof ex.user === 'number' ? ex.user : (ex.user as User)?.id
      if (!userId) {
        failed++
        continue
      }

      // Atomic credit deduction — no need to read user credits first
      const creditResult = await payload.db.drizzle.execute(
        sql`UPDATE users SET credits = credits - ${price} WHERE id = ${userId} AND credits >= ${price} RETURNING credits`
      )
      const creditRows = creditResult.rows as Array<{ credits: number }> | undefined

      if (!creditRows || creditRows.length === 0) {
        // Insufficient credits — disable auto-renew and notify
        await payload.update({
          collection: 'macro-exchanges',
          id: ex.id,
          data: { autoRenew: false },
          overrideAccess: true,
        })

        await payload.create({
          collection: 'notifications',
          data: {
            recipient: userId,
            title: '自动续费失败',
            body: `「${macroDoc.title}」自动续费失败：点券不足（需要 ${price}）。请购买点券后手动续费。`,
            link: `/macros/${macroDoc.slug}`,
            category: 'order',
            read: false,
          },
          overrideAccess: true,
        })

        writeAuditLog({
          action: 'auto_renew',
          collection: 'macro-exchanges',
          docId: String(ex.id),
          operator: userId,
          ip: 'cron',
          reason: `自动续费失败：点券不足（需要 ${price}）`,
          metadata: { macroId: macroDoc.id, macroTitle: macroDoc.title },
        })

        failed++
        continue
      }

      const newCredits = creditRows[0].credits
      const baseTime = ex.expiresAt ? new Date(ex.expiresAt) : now
      const newExpiresAt = durationDays > 0
        ? new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      await payload.update({
        collection: 'macro-exchanges',
        id: ex.id,
        data: { expiresAt: newExpiresAt },
        overrideAccess: true,
      })

      await payload.create({
        collection: 'credit-transactions',
        data: {
          user: userId,
          amount: -price,
          balanceAfter: newCredits,
          type: 'renew',
          relatedExchange: ex.id,
          reason: `自动续费「${macroDoc.title}」`,
        },
        overrideAccess: true,
      })

      await payload.create({
        collection: 'notifications',
        data: {
          recipient: userId,
          title: '自动续费成功',
          body: `「${macroDoc.title}」已自动续费，扣除 ${price} 点券。有效期延至 ${newExpiresAt ? newExpiresAt.slice(0, 10) : '永久'}。`,
          link: `/macros/${macroDoc.slug}`,
          category: 'order',
          read: false,
        },
        overrideAccess: true,
      })

      writeAuditLog({
        action: 'auto_renew',
        collection: 'macro-exchanges',
        docId: String(ex.id),
        operator: userId,
        ip: 'cron',
        reason: `自动续费「${macroDoc.title}」扣除 ${price} 点券`,
        metadata: { macroId: macroDoc.id, macroTitle: macroDoc.title, credits: newCredits },
      })

      renewed++
    }

    return NextResponse.json(success({
      checked: exchanges.docs.length,
      renewed,
      failed,
    }))
  } catch (_err) {
    return internalError('Failed to process auto-renew')
  }
}
