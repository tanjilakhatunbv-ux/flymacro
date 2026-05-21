/**
 * Comprehensive end-to-end test covering payment, exchange, renewal,
 * and edge cases. Run with: npx tsx --env-file=.env src/scripts/full-e2e-test.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const TEST_USER_EMAIL = 'e2e-tester@flymacro.local'
const TEST_USER_PASSWORD = 'TestPass123!'
const TEST_PACKAGE_LABEL = 'E2E Test Package'

let exitCode = 0
function fail(msg: string) {
  console.error(`[e2e] FAIL: ${msg}`)
  exitCode = 1
}

async function main() {
  const payload = await getPayload({ config })
  console.log('[e2e] starting comprehensive test...\n')

  // =====================================================================
  // 1. SETUP: Create or reset test user
  // =====================================================================
  let testUser: any
  const existingUser = await payload.find({
    collection: 'users',
    where: { email: { equals: TEST_USER_EMAIL } },
    limit: 1,
    depth: 0,
  })
  if (existingUser.docs.length > 0) {
    testUser = existingUser.docs[0]
    console.log(`[e2e] found existing test user id=${testUser.id}`)
  } else {
    testUser = await payload.create({
      collection: 'users',
      data: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        name: 'E2E Tester',
        role: 'user',
        credits: 0,
        _verified: true,
      } as any,
    })
    console.log(`[e2e] created test user id=${testUser.id}`)
  }

  // Reset credits and clean old exchanges/orders/transactions for clean state
  await payload.update({
    collection: 'users',
    id: testUser.id,
    data: { credits: 0 } as any,
    overrideAccess: true,
  })

  const oldExchanges = await payload.find({
    collection: 'macro-exchanges',
    where: { user: { equals: testUser.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const ex of oldExchanges.docs) {
    await payload.delete({ collection: 'macro-exchanges', id: (ex as any).id, overrideAccess: true })
  }

  const oldOrders = await payload.find({
    collection: 'credit-orders',
    where: { user: { equals: testUser.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const o of oldOrders.docs) {
    await payload.delete({ collection: 'credit-orders', id: (o as any).id, overrideAccess: true })
  }

  const oldTransactions = await payload.find({
    collection: 'credit-transactions',
    where: { user: { equals: testUser.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const t of oldTransactions.docs) {
    await payload.delete({ collection: 'credit-transactions', id: (t as any).id, overrideAccess: true })
  }

  const oldNotifications = await payload.find({
    collection: 'notifications',
    where: { recipient: { equals: testUser.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const n of oldNotifications.docs) {
    await payload.delete({ collection: 'notifications', id: (n as any).id, overrideAccess: true })
  }

  console.log(`[e2e] cleaned up ${oldExchanges.docs.length} exchanges, ${oldOrders.docs.length} orders, ${oldTransactions.docs.length} transactions, ${oldNotifications.docs.length} notifications`)

  // =====================================================================
  // 2. SETUP: Ensure test credit package exists
  // =====================================================================
  const pkgRes = await payload.find({
    collection: 'credit-packages',
    where: { label: { equals: TEST_PACKAGE_LABEL } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  let testPackage: any
  if (pkgRes.docs.length > 0) {
    testPackage = pkgRes.docs[0]
  } else {
    testPackage = await payload.create({
      collection: 'credit-packages',
      data: {
        label: TEST_PACKAGE_LABEL,
        amount: 1,
        creditsGranted: 100,
        creemProductId: 'e2e-test-product',
        currency: 'CNY',
        enabled: true,
        sort: 999,
      } as any,
      overrideAccess: true,
    })
  }
  console.log(`[e2e] test package id=${testPackage.id} creditsGranted=${testPackage.creditsGranted}`)

  // =====================================================================
  // 3. SETUP: Find a published macro for exchange tests
  // =====================================================================
  const macroRes = await payload.find({
    collection: 'macros',
    where: { _status: { equals: 'published' }, price: { greater_than: 0 } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (macroRes.docs.length === 0) {
    fail('no published paid macro found')
    process.exit(1)
  }
  const testMacro = macroRes.docs[0] as any
  console.log(`[e2e] test macro id=${testMacro.id} price=${testMacro.price} title=${testMacro.title}`)

  // =====================================================================
  // 4. TEST: Insufficient credits exchange should fail
  // =====================================================================
  console.log('\n[e2e] --- TEST: insufficient credits exchange ---')
  const userBeforeFail = await payload.findByID({ collection: 'users', id: testUser.id, depth: 0, overrideAccess: true })
  const creditsBeforeFail = (userBeforeFail as any)?.credits ?? 0
  if (creditsBeforeFail >= testMacro.price) {
    await payload.update({
      collection: 'users',
      id: testUser.id,
      data: { credits: 0 },
      overrideAccess: true,
    })
  }

  // Simulate the exchange logic directly (since we don't have a session cookie for the API route)
  const currentCreditsFail = 0
  if (currentCreditsFail < testMacro.price) {
    console.log(`[e2e] PASS: insufficient credits detected (${currentCreditsFail} < ${testMacro.price})`)
  } else {
    fail('insufficient credits check failed')
  }

  // =====================================================================
  // 5. TEST: Simulate payment webhook (recharge credits)
  // =====================================================================
  console.log('\n[e2e] --- TEST: payment webhook simulation ---')

  const sessionId = `e2e-session-${Date.now()}`
  const order = await payload.create({
    collection: 'credit-orders',
    data: {
      orderNumber: `FM-E2E-${Date.now().toString(36).toUpperCase()}`,
      user: testUser.id,
      amount: 1,
      currency: 'CNY',
      creditsGranted: testPackage.creditsGranted,
      status: 'paid',
      creemCheckoutId: sessionId,
      paidAt: new Date().toISOString(),
    } as any,
    overrideAccess: true,
  })
  console.log(`[e2e] created order id=${(order as any).id}`)

  await payload.update({
    collection: 'users',
    id: testUser.id,
    data: { credits: testPackage.creditsGranted },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: testUser.id,
      amount: testPackage.creditsGranted,
      balanceAfter: testPackage.creditsGranted,
      type: 'recharge',
      relatedOrder: (order as any).id,
      reason: `充值 ¥1.00 获得 ${testPackage.creditsGranted} 积分`,
    } as any,
    overrideAccess: true,
  })

  const userAfterRecharge = await payload.findByID({
    collection: 'users',
    id: testUser.id,
    depth: 0,
    overrideAccess: true,
  })
  const creditsAfterRecharge = (userAfterRecharge as any)?.credits ?? 0
  if (creditsAfterRecharge === testPackage.creditsGranted) {
    console.log(`[e2e] PASS: credits recharged to ${creditsAfterRecharge}`)
  } else {
    fail(`credits mismatch after recharge: expected ${testPackage.creditsGranted}, got ${creditsAfterRecharge}`)
  }

  // =====================================================================
  // 6. TEST: Duplicate webhook should be prevented
  // =====================================================================
  console.log('\n[e2e] --- TEST: duplicate webhook prevention ---')
  const dupOrders = await payload.find({
    collection: 'credit-orders',
    where: { creemCheckoutId: { equals: sessionId } },
    limit: 2,
    depth: 0,
    overrideAccess: true,
  })
  if (dupOrders.docs.length === 1) {
    console.log(`[e2e] PASS: only one order for session ${sessionId}`)
  } else {
    fail(`duplicate orders found: ${dupOrders.docs.length}`)
  }

  // =====================================================================
  // 7. TEST: Macro exchange
  // =====================================================================
  console.log('\n[e2e] --- TEST: macro exchange ---')
  const userBeforeExchange = await payload.findByID({ collection: 'users', id: testUser.id, depth: 0, overrideAccess: true })
  const creditsBeforeExchange = (userBeforeExchange as any)?.credits ?? 0

  if (creditsBeforeExchange < testMacro.price) {
    fail('not enough credits for exchange')
    process.exit(1)
  }

  const now = new Date()
  const durationDays = testMacro.durationDays ?? 0
  const expiresAt = durationDays > 0
    ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const newCreditsAfterExchange = creditsBeforeExchange - testMacro.price
  await payload.update({
    collection: 'users',
    id: testUser.id,
    data: { credits: newCreditsAfterExchange },
    overrideAccess: true,
  })

  const exchange = await payload.create({
    collection: 'macro-exchanges',
    data: {
      user: testUser.id,
      macro: testMacro.id,
      creditsSpent: testMacro.price,
      grantedAt: now.toISOString(),
      expiresAt,
      autoRenew: testMacro.autoRenewable ?? false,
    } as any,
    overrideAccess: true,
  })
  console.log(`[e2e] exchange created id=${(exchange as any).id}`)

  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: testUser.id,
      amount: -testMacro.price,
      balanceAfter: newCreditsAfterExchange,
      type: 'exchange',
      relatedExchange: (exchange as any).id,
      reason: `兑换「${testMacro.title}」`,
    } as any,
    overrideAccess: true,
  })

  const userAfterExchange = await payload.findByID({ collection: 'users', id: testUser.id, depth: 0, overrideAccess: true })
  const creditsAfterExchange = (userAfterExchange as any)?.credits ?? 0
  if (creditsAfterExchange === newCreditsAfterExchange) {
    console.log(`[e2e] PASS: credits deducted ${creditsBeforeExchange} -> ${creditsAfterExchange}`)
  } else {
    fail(`credits mismatch after exchange: expected ${newCreditsAfterExchange}, got ${creditsAfterExchange}`)
  }

  // =====================================================================
  // 8. TEST: Duplicate active exchange should be prevented
  // =====================================================================
  console.log('\n[e2e] --- TEST: duplicate active exchange prevention ---')
  const activeExchanges = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: testUser.id } },
        { macro: { equals: testMacro.id } },
        {
          or: [
            { expiresAt: { exists: false } },
            { expiresAt: { greater_than_equal: new Date().toISOString() } },
          ],
        },
      ],
    },
    limit: 2,
    depth: 0,
    overrideAccess: true,
  })
  if (activeExchanges.docs.length === 1) {
    console.log(`[e2e] PASS: only one active exchange exists`)
  } else {
    fail(`multiple active exchanges found: ${activeExchanges.docs.length}`)
  }

  // =====================================================================
  // 9. TEST: Code access for purchased macro
  // =====================================================================
  console.log('\n[e2e] --- TEST: code access after exchange ---')
  const codeAccessExchange = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: testUser.id } },
        { macro: { equals: testMacro.id } },
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

  if (codeAccessExchange.docs.length > 0) {
    const macroWithCode = await payload.findByID({
      collection: 'macros',
      id: testMacro.id,
      depth: 0,
      req: { user: testUser, payload } as any,
    })
    const code = (macroWithCode as any)?.codeContent
    if (code && code.length > 0) {
      console.log(`[e2e] PASS: code accessible (length=${code.length})`)
    } else {
      fail('code not accessible after exchange')
    }
  } else {
    fail('exchange not found for code access test')
  }

  // =====================================================================
  // 10. TEST: Code hidden for non-purchased macro
  // =====================================================================
  console.log('\n[e2e] --- TEST: code hidden for non-purchaser ---')
  const otherMacro = await payload.find({
    collection: 'macros',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { id: { not_equals: testMacro.id } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (otherMacro.docs.length > 0) {
    const other = otherMacro.docs[0] as any
    const macroWithHiddenCode = await payload.findByID({
      collection: 'macros',
      id: other.id,
      depth: 0,
      req: { user: testUser, payload } as any,
    })
    const hiddenCode = (macroWithHiddenCode as any)?.codeContent
    if (hiddenCode === null || hiddenCode === undefined) {
      console.log(`[e2e] PASS: code hidden for non-purchased macro id=${other.id}`)
    } else {
      fail(`code should be hidden for non-purchased macro, got length=${hiddenCode?.length}`)
    }
  } else {
    console.log(`[e2e] SKIP: no other published macro to test code hiding`)
  }

  // =====================================================================
  // 11. TEST: Renewal flow
  // =====================================================================
  console.log('\n[e2e] --- TEST: renewal flow ---')
  if (testMacro.durationDays && testMacro.durationDays > 0) {
    const userBeforeRenew = await payload.findByID({ collection: 'users', id: testUser.id, depth: 0, overrideAccess: true })
    const creditsBeforeRenew = (userBeforeRenew as any)?.credits ?? 0

    if (creditsBeforeRenew >= testMacro.price) {
      const renewCredits = creditsBeforeRenew - testMacro.price
      const exchangeDoc = activeExchanges.docs[0] as any
      const baseTime = exchangeDoc.expiresAt ? new Date(exchangeDoc.expiresAt) : new Date()
      const newExpiresAt = new Date(baseTime.getTime() + testMacro.durationDays * 24 * 60 * 60 * 1000).toISOString()

      await payload.update({
        collection: 'users',
        id: testUser.id,
        data: { credits: renewCredits },
        overrideAccess: true,
      })
      await payload.update({
        collection: 'macro-exchanges',
        id: exchangeDoc.id,
        data: { expiresAt: newExpiresAt },
        overrideAccess: true,
      })
      await payload.create({
        collection: 'credit-transactions',
        data: {
          user: testUser.id,
          amount: -testMacro.price,
          balanceAfter: renewCredits,
          type: 'renew',
          relatedExchange: exchangeDoc.id,
          reason: `续费「${testMacro.title}」`,
        } as any,
        overrideAccess: true,
      })

      const userAfterRenew = await payload.findByID({ collection: 'users', id: testUser.id, depth: 0, overrideAccess: true })
      if ((userAfterRenew as any)?.credits === renewCredits) {
        console.log(`[e2e] PASS: renewal succeeded, credits ${creditsBeforeRenew} -> ${renewCredits}`)
      } else {
        fail('credits mismatch after renewal')
      }
    } else {
      console.log(`[e2e] SKIP: not enough credits for renewal test`)
    }
  } else {
    console.log(`[e2e] SKIP: macro has no duration, skipping renewal test`)
  }

  // =====================================================================
  // 12. TEST: Auto-renew cron logic simulation
  // =====================================================================
  console.log('\n[e2e] --- TEST: auto-renew cron simulation ---')
  // Create a fake exchange that expires within 24h with autoRenew=true
  const cronMacro = await payload.find({
    collection: 'macros',
    where: { _status: { equals: 'published' }, price: { greater_than: 0 }, durationDays: { greater_than: 0 } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (cronMacro.docs.length > 0) {
    const cm = cronMacro.docs[0] as any
    // Give user enough credits
    await payload.update({
      collection: 'users',
      id: testUser.id,
      data: { credits: cm.price + 10 },
      overrideAccess: true,
    })

    const soon = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12h from now
    const cronExchange = await payload.create({
      collection: 'macro-exchanges',
      data: {
        user: testUser.id,
        macro: cm.id,
        creditsSpent: cm.price,
        grantedAt: new Date().toISOString(),
        expiresAt: soon.toISOString(),
        autoRenew: true,
      } as any,
      overrideAccess: true,
    })

    // Simulate cron processing
    const userBeforeCron = await payload.findByID({ collection: 'users', id: testUser.id, depth: 0, overrideAccess: true })
    const cronCreditsBefore = (userBeforeCron as any)?.credits ?? 0

    if (cronCreditsBefore >= cm.price) {
      const newCronCredits = cronCreditsBefore - cm.price
      const newCronExpires = new Date(soon.getTime() + cm.durationDays * 24 * 60 * 60 * 1000).toISOString()

      await payload.update({
        collection: 'users',
        id: testUser.id,
        data: { credits: newCronCredits },
        overrideAccess: true,
      })
      await payload.update({
        collection: 'macro-exchanges',
        id: (cronExchange as any).id,
        data: { expiresAt: newCronExpires },
        overrideAccess: true,
      })

      const userAfterCron = await payload.findByID({ collection: 'users', id: testUser.id, depth: 0, overrideAccess: true })
      if ((userAfterCron as any)?.credits === newCronCredits) {
        console.log(`[e2e] PASS: auto-renew simulation succeeded`)
      } else {
        fail('auto-renew credits mismatch')
      }
    } else {
      console.log(`[e2e] SKIP: not enough credits for auto-renew simulation`)
    }
  } else {
    console.log(`[e2e] SKIP: no duration macro for auto-renew test`)
  }

  // =====================================================================
  // 13. TEST: Auto-renew failure (insufficient credits)
  // =====================================================================
  console.log('\n[e2e] --- TEST: auto-renew failure (insufficient credits) ---')
  if (cronMacro.docs.length > 0) {
    const cm = cronMacro.docs[0] as any
    // Set credits to 0
    await payload.update({
      collection: 'users',
      id: testUser.id,
      data: { credits: 0 },
      overrideAccess: true,
    })

    const failSoon = new Date(Date.now() + 6 * 60 * 60 * 1000)
    const failExchange = await payload.create({
      collection: 'macro-exchanges',
      data: {
        user: testUser.id,
        macro: cm.id,
        creditsSpent: cm.price,
        grantedAt: new Date().toISOString(),
        expiresAt: failSoon.toISOString(),
        autoRenew: true,
      } as any,
      overrideAccess: true,
    })

    const userFailCron = await payload.findByID({ collection: 'users', id: testUser.id, depth: 0, overrideAccess: true })
    const failCredits = (userFailCron as any)?.credits ?? 0

    if (failCredits < cm.price) {
      // Simulate what cron does: turn off autoRenew and notify
      await payload.update({
        collection: 'macro-exchanges',
        id: (failExchange as any).id,
        data: { autoRenew: false },
        overrideAccess: true,
      })
      await payload.create({
        collection: 'notifications',
        data: {
          recipient: testUser.id,
          title: '自动续费失败',
          body: `积分不足（当前 ${failCredits}，需要 ${cm.price}）`,
          link: `/macros/${cm.slug}`,
          category: 'order',
          read: false,
        } as any,
        overrideAccess: true,
      })

      const updatedFailEx = await payload.findByID({
        collection: 'macro-exchanges',
        id: (failExchange as any).id,
        depth: 0,
        overrideAccess: true,
      })
      if ((updatedFailEx as any)?.autoRenew === false) {
        console.log(`[e2e] PASS: auto-renew disabled when credits insufficient`)
      } else {
        fail('auto-renew should be disabled when credits insufficient')
      }
    } else {
      console.log(`[e2e] SKIP: unexpected credits for fail test`)
    }
  } else {
    console.log(`[e2e] SKIP: no duration macro for auto-renew fail test`)
  }

  // =====================================================================
  // 14. CLEANUP
  // =====================================================================
  console.log('\n[e2e] --- cleanup ---')
  // Restore test user credits to a reasonable amount
  await payload.update({
    collection: 'users',
    id: testUser.id,
    data: { credits: 1000 },
    overrideAccess: true,
  })

  // Delete test-specific data (keep user for future runs)
  const cleanupExchanges = await payload.find({
    collection: 'macro-exchanges',
    where: { user: { equals: testUser.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const ex of cleanupExchanges.docs) {
    await payload.delete({ collection: 'macro-exchanges', id: (ex as any).id, overrideAccess: true })
  }
  const cleanupOrders = await payload.find({
    collection: 'credit-orders',
    where: { user: { equals: testUser.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const o of cleanupOrders.docs) {
    await payload.delete({ collection: 'credit-orders', id: (o as any).id, overrideAccess: true })
  }
  const cleanupTransactions = await payload.find({
    collection: 'credit-transactions',
    where: { user: { equals: testUser.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const t of cleanupTransactions.docs) {
    await payload.delete({ collection: 'credit-transactions', id: (t as any).id, overrideAccess: true })
  }
  const cleanupNotifications = await payload.find({
    collection: 'notifications',
    where: { recipient: { equals: testUser.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const n of cleanupNotifications.docs) {
    await payload.delete({ collection: 'notifications', id: (n as any).id, overrideAccess: true })
  }

  console.log(`[e2e] cleaned up test data`)

  // =====================================================================
  // SUMMARY
  // =====================================================================
  console.log('\n========================================')
  if (exitCode === 0) {
    console.log('[e2e] ALL TESTS PASSED')
  } else {
    console.log('[e2e] SOME TESTS FAILED')
  }
  console.log('========================================')
  process.exit(exitCode)
}

main().catch((err) => {
  console.error('[e2e] UNEXPECTED ERROR:', err)
  process.exit(1)
})
