import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'

/**
 * Auto-renew cron job.
 * Should be called once per day (e.g. via Vercel Cron or external scheduler).
 * Renews macro-exchanges where autoRenew=true and expires within 24h.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const url = new URL(req.url)
  const provided = url.searchParams.get('secret') || req.headers.get('x-cron-secret')
  if (secret && provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!secret) {
    console.warn('[AutoRenew] CRON_SECRET is not set. Cron endpoint is publicly accessible.')
  }

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

  for (const ex of exchanges.docs as any[]) {
    const macro = typeof ex.macro === 'number'
      ? await payload.findByID({ collection: 'macros', id: ex.macro, depth: 0 }).catch(() => null)
      : ex.macro

    if (!macro) {
      console.warn(`[AutoRenew] Macro not found for exchange ${ex.id}`)
      failed++
      continue
    }

    const price = macro.price ?? 0
    const durationDays = macro.durationDays ?? 0
    const userId = typeof ex.user === 'number' ? ex.user : ex.user?.id
    if (!userId) {
      failed++
      continue
    }

    const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 }).catch(() => null) as any
    if (!user) {
      failed++
      continue
    }

    const currentCredits = user.credits ?? 0

    if (currentCredits < price) {
      await payload.update({
        collection: 'macro-exchanges',
        id: ex.id,
        data: { autoRenew: false } as any,
        overrideAccess: true,
      })

      await payload.create({
        collection: 'notifications',
        data: {
          recipient: userId,
          title: '自动续费失败',
          body: `「${macro.title}」自动续费失败：积分不足（当前 ${currentCredits}，需要 ${price}）。请充值后手动续费。`,
          link: `/macros/${macro.slug}`,
          category: 'order',
          read: false,
        } as any,
        overrideAccess: true,
      })

      failed++
      console.log(`[AutoRenew] Failed for user ${userId}: insufficient credits (${currentCredits} < ${price})`)
      continue
    }

    const newCredits = currentCredits - price
    const baseTime = ex.expiresAt ? new Date(ex.expiresAt) : now
    const newExpiresAt = durationDays > 0
      ? new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    await payload.update({
      collection: 'users',
      id: userId,
      data: { credits: newCredits } as any,
      overrideAccess: true,
    })

    await payload.update({
      collection: 'macro-exchanges',
      id: ex.id,
      data: { expiresAt: newExpiresAt } as any,
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
        reason: `自动续费「${macro.title}」`,
      } as any,
      overrideAccess: true,
    })

    await payload.create({
      collection: 'notifications',
      data: {
        recipient: userId,
        title: '自动续费成功',
        body: `「${macro.title}」已自动续费，扣除 ${price} 积分。有效期延至 ${newExpiresAt ? newExpiresAt.slice(0, 10) : '永久'}。`,
        link: `/macros/${macro.slug}`,
        category: 'order',
        read: false,
      } as any,
      overrideAccess: true,
    })

    renewed++
    console.log(`[AutoRenew] Renewed exchange ${ex.id} for user ${userId}, -${price} credits`)
  }

  return NextResponse.json({
    success: true,
    checked: exchanges.docs.length,
    renewed,
    failed,
  })
}
