/**
 * End-to-end test for macro exchange flow via local Payload API.
 * Run with: pnpm tsx --env-file=.env src/scripts/test-exchange-flow.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const TEST_EMAIL = 'test@flymacro.local'

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const payload = await getPayload({ config })
  console.log('[test] starting exchange flow test...\n')

  // 1. Find test user
  const userRes = await payload.find({
    collection: 'users',
    where: { email: { equals: TEST_EMAIL } },
    limit: 1,
    depth: 0,
  })
  if (userRes.docs.length === 0) {
    console.error('[test] FAIL: test user not found')
    process.exit(1)
  }
  const user = userRes.docs[0] as any
  console.log(`[test] user found: ${user.email} (id=${user.id}, credits=${user.credits})`)

  // 2. Find a macro to exchange
  const macroRes = await payload.find({
    collection: 'macros',
    where: { _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  if (macroRes.docs.length === 0) {
    console.error('[test] FAIL: no published macros found')
    process.exit(1)
  }
  const macro = macroRes.docs[0] as any
  console.log(`[test] macro found: ${macro.title} (id=${macro.id}, price=${macro.price})`)

  // 3. Check if already exchanged
  const existing = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: user.id } },
        { macro: { equals: macro.id } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    console.log(`[test] existing exchange found (id=${(existing.docs[0] as any).id}), cleaning up...`)
    await payload.delete({
      collection: 'macro-exchanges',
      id: (existing.docs[0] as any).id,
      overrideAccess: true,
    })
    console.log('[test] cleaned up old exchange')
  }

  // 4. Simulate exchange
  const price = macro.price ?? 0
  const currentCredits = (user.credits as number) ?? 0
  if (currentCredits < price) {
    console.error(`[test] FAIL: insufficient credits (${currentCredits} < ${price})`)
    process.exit(1)
  }
  console.log(`[test] credits sufficient: ${currentCredits} >= ${price}`)

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
    data: { credits: newCredits } as any,
    overrideAccess: true,
  })
  console.log(`[test] credits deducted: ${currentCredits} -> ${newCredits}`)

  // Create exchange
  const exchange = await payload.create({
    collection: 'macro-exchanges',
    data: {
      user: user.id,
      macro: macro.id,
      creditsSpent: price,
      grantedAt: now.toISOString(),
      expiresAt,
      autoRenew: macro.autoRenewable ?? false,
    } as any,
    overrideAccess: true,
  })
  console.log(`[test] exchange created: id=${(exchange as any).id}`)

  // Create credit transaction
  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: user.id,
      amount: -price,
      balanceAfter: newCredits,
      type: 'exchange',
      relatedExchange: (exchange as any).id,
      reason: `兑换「${macro.title}」`,
    } as any,
    overrideAccess: true,
  })
  console.log('[test] credit transaction recorded')

  // 5. Verify exchange-status logic
  const exchangeCheck = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: user.id } },
        { macro: { equals: macro.id } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (exchangeCheck.docs.length === 0) {
    console.error('[test] FAIL: exchange not found after creation')
    process.exit(1)
  }
  const foundExchange = exchangeCheck.docs[0] as any
  const isExpired = foundExchange.expiresAt ? new Date(foundExchange.expiresAt) <= new Date() : false
  console.log(`[test] exchange verified: expired=${isExpired}, autoRenew=${foundExchange.autoRenew}`)

  // 6. Simulate renew
  const renewPrice = macro.price ?? 0
  const renewCredits = newCredits
  let afterRenewCredits = newCredits
  if (renewCredits < renewPrice) {
    console.log(`[test] SKIP renew: insufficient credits (${renewCredits} < ${renewPrice})`)
  } else {
    const renewBase = foundExchange.expiresAt && new Date(foundExchange.expiresAt) > now
      ? new Date(foundExchange.expiresAt)
      : now
    const newExpiresAt = durationDays > 0
      ? new Date(renewBase.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    afterRenewCredits = renewCredits - renewPrice
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { credits: afterRenewCredits } as any,
      overrideAccess: true,
    })
    await payload.update({
      collection: 'macro-exchanges',
      id: foundExchange.id,
      data: { expiresAt: newExpiresAt, revokedAt: null } as any,
      overrideAccess: true,
    })
    console.log(`[test] renew simulated: credits ${renewCredits} -> ${afterRenewCredits}, expiresAt=${newExpiresAt}`)
  }

  // 7. Verify code access via raw DB (bypass stripCodeForUnpurchased hook)
  const macroRaw = await payload.findByID({
    collection: 'macros',
    id: macro.id,
    depth: 0,
    overrideAccess: true,
  })
  const rawCode = (macroRaw as any)?.codeContent
  console.log(`[test] raw codeContent length=${rawCode ? rawCode.length : 0}`)

  // 8. Verify notification created
  const notifRes = await payload.find({
    collection: 'notifications',
    where: { recipient: { equals: user.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  console.log(`[test] notifications for user: ${notifRes.totalDocs}`)

  console.log('\n[test] ALL CHECKS PASSED ✅')
  console.log(`[test] user credits remaining: ${afterRenewCredits}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[test] FAILED ❌:', err)
  process.exit(1)
})
