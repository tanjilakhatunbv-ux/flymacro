import { sql } from '@payloadcms/db-postgres'
import { getPayload } from './payload'
import { writeAuditLog } from './audit'
import type { Macro, MacroExchange, User } from '../payload-types'

type Payload = Awaited<ReturnType<typeof getPayload>>

type MacroExchangeErrorCode =
  | 'macro-not-found'
  | 'invalid-macro'
  | 'already-exchanged'
  | 'insufficient-credits'
  | 'exchange-not-found'
  | 'forbidden'

export class MacroExchangeError extends Error {
  public readonly code: MacroExchangeErrorCode
  public readonly metadata?: Record<string, unknown>

  constructor(code: MacroExchangeErrorCode, message?: string, metadata?: Record<string, unknown>) {
    const errorMessage = message ?? code
    super(errorMessage)
    this.name = 'MacroExchangeError'
    this.code = code
    this.metadata = metadata
  }
}

export async function exchangeMacroForUser(
  data: { user: User; macroSlug: string; ip: string },
  payload?: Payload,
): Promise<{ credits: number; expiresAt: string | null; autoRenew: boolean }> {
  const payloadClient = payload ?? await getPayload()
  const macroRes = await payloadClient.find({
    collection: 'macros',
    where: { slug: { equals: data.macroSlug } },
    limit: 1,
    depth: 0,
  })
  const macro = macroRes.docs[0] as Macro | undefined

  if (!macro) throw new MacroExchangeError('macro-not-found')

  const price = macro.price ?? 0
  if (price === 0) throw new MacroExchangeError('invalid-macro')

  let newCredits: number

  await payloadClient.db.drizzle.execute(sql`BEGIN`)
  try {
    const existingRes = await payloadClient.db.drizzle.execute(
      sql`SELECT id FROM macro_exchanges WHERE user_id = ${data.user.id} AND macro_id = ${macro.id} AND (expires_at IS NULL OR expires_at >= NOW()) LIMIT 1`,
    )
    const existingRows = existingRes.rows as Array<{ id: number }> | undefined
    if (existingRows && existingRows.length > 0) {
      throw new MacroExchangeError('already-exchanged')
    }

    const result = await payloadClient.db.drizzle.execute(
      sql`UPDATE users SET credits = credits - ${price} WHERE id = ${data.user.id} AND credits >= ${price} RETURNING credits`,
    )
    const rows = result.rows as Array<{ credits: number }> | undefined
    if (!rows || rows.length === 0) {
      throw new MacroExchangeError('insufficient-credits', `insufficient credits`, { price })
    }
    newCredits = rows[0].credits

    await payloadClient.db.drizzle.execute(sql`COMMIT`)
  } catch (err) {
    await payloadClient.db.drizzle.execute(sql`ROLLBACK`).catch(() => {})
    throw err
  }

  const now = new Date()
  const durationDays = macro.durationDays ?? 0
  const expiresAt = durationDays > 0
    ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const exchange = await payloadClient.create({
    collection: 'macro-exchanges',
    data: {
      user: data.user.id,
      macro: macro.id,
      creditsSpent: price,
      grantedAt: now.toISOString(),
      expiresAt,
      autoRenew: macro.autoRenewable ?? false,
    },
    overrideAccess: true,
  })

  await payloadClient.create({
    collection: 'credit-transactions',
    data: {
      user: data.user.id,
      amount: -price,
      balanceAfter: newCredits,
      type: 'exchange',
      relatedExchange: exchange.id,
      reason: `\u5151\u6362\u300a${macro.title}\u300b`,
    },
    overrideAccess: true,
  })

  await payloadClient.create({
    collection: 'notifications',
    data: {
      recipient: data.user.id,
      title: '\u5151\u6362\u6210\u529f',
      body: `\u4f60\u5df2\u6210\u529f\u5151\u6362\u300a${macro.title}\u300b\uff0c\u82b1\u8d39 ${price} \u70b9\u5238\u3002${expiresAt ? `\u6709\u6548\u671f\u81f3 ${expiresAt.slice(0, 10)}` : '\u6c38\u4e45\u6709\u6548'}\u3002`,
      link: `/macros/${data.macroSlug}`,
      category: 'order',
      read: false,
    },
    overrideAccess: true,
  })

  writeAuditLog({
    action: 'exchange',
    collection: 'macros',
    docId: String(macro.id),
    operator: data.user.id,
    ip: data.ip,
    reason: `\u5151\u6362\u300a${macro.title}\u300b\u82b1\u8d39 ${price} \u70b9\u5238`,
    metadata: { credits: newCredits, exchangeId: exchange.id },
  })

  return { credits: newCredits, expiresAt, autoRenew: macro.autoRenewable ?? false }
}

export async function renewMacroExchangeForUser(
  data: { user: User; exchangeId: number | string; ip: string },
  payload?: Payload,
): Promise<{ credits: number; expiresAt: string | null }> {
  const payloadClient = payload ?? await getPayload()
  const exchange = await payloadClient
    .findByID({
      collection: 'macro-exchanges',
      id: data.exchangeId,
      depth: 1,
    })
    .catch(() => null) as MacroExchange | null

  if (!exchange) throw new MacroExchangeError('exchange-not-found')

  const ownerId = typeof exchange.user === 'object' ? exchange.user.id : exchange.user
  if (ownerId !== data.user.id && !['admin', 'operator'].includes(data.user.role ?? '')) {
    throw new MacroExchangeError('forbidden')
  }

  const macro =
    typeof exchange.macro === 'number'
      ? ((await payloadClient
          .findByID({ collection: 'macros', id: exchange.macro, depth: 0 })
          .catch(() => null)) as Macro | null)
      : (exchange.macro as Macro | null)

  if (!macro) throw new MacroExchangeError('macro-not-found')

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

  const result = await payloadClient.db.drizzle.execute(
    sql`UPDATE users SET credits = credits - ${price} WHERE id = ${data.user.id} AND credits >= ${price} RETURNING credits`,
  )
  const rows = result.rows as Array<{ credits: number }> | undefined
  if (!rows || rows.length === 0) {
    throw new MacroExchangeError('insufficient-credits', 'insufficient credits', { price })
  }
  const newCredits = rows[0].credits

  await payloadClient.update({
    collection: 'macro-exchanges',
    id: data.exchangeId,
    data: {
      expiresAt: newExpiresAt,
      revokedAt: null,
    },
    overrideAccess: true,
  })

  await payloadClient.create({
    collection: 'credit-transactions',
    data: {
      user: data.user.id,
      amount: -price,
      balanceAfter: newCredits,
      type: 'renew',
      relatedExchange: Number(data.exchangeId),
      reason: `\u7eed\u8d39\u300a${macro.title}\u300b`,
    },
    overrideAccess: true,
  })

  writeAuditLog({
    action: 'renew',
    collection: 'macros',
    docId: String(macro.id),
    operator: data.user.id,
    ip: data.ip,
    reason: `\u7eed\u8d39\u300a${macro.title}\u300b\u82b1\u8d39 ${price} \u70b9\u5238`,
    metadata: { credits: newCredits, exchangeId: data.exchangeId },
  })

  return { credits: newCredits, expiresAt: newExpiresAt }
}

interface ExchangeDoc {
  id: number
  macro: number | Macro
  user: number | User
  expiresAt: string | null
  autoRenew: boolean
}

export async function processDueMacroAutoRenewals(payload?: Payload): Promise<{
  checked: number
  renewed: number
  failed: number
}> {
  const payloadClient = payload ?? await getPayload()
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const exchanges = await payloadClient.find({
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

    const creditResult = await payloadClient.db.drizzle.execute(
      sql`UPDATE users SET credits = credits - ${price} WHERE id = ${userId} AND credits >= ${price} RETURNING credits`,
    )
    const creditRows = creditResult.rows as Array<{ credits: number }> | undefined

    if (!creditRows || creditRows.length === 0) {
      await payloadClient.update({
        collection: 'macro-exchanges',
        id: ex.id,
        data: { autoRenew: false },
        overrideAccess: true,
      })

      await payloadClient.create({
        collection: 'notifications',
        data: {
          recipient: userId,
          title: '\u81ea\u52a8\u7eed\u8d39\u5931\u8d25',
          body: `\u300a${macroDoc.title}\u300b\u81ea\u52a8\u7eed\u8d39\u5931\u8d25\uff1a\u70b9\u5238\u4e0d\u8db3\uff08\u9700\u8981 ${price}\uff09\u3002\u8bf7\u8d2d\u4e70\u70b9\u5238\u540e\u624b\u52a8\u7eed\u8d39\u3002`,
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
        reason: `\u81ea\u52a8\u7eed\u8d39\u5931\u8d25\uff1a\u70b9\u5238\u4e0d\u8db3\uff08\u9700\u8981 ${price}\uff09`,
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

    await payloadClient.update({
      collection: 'macro-exchanges',
      id: ex.id,
      data: { expiresAt: newExpiresAt },
      overrideAccess: true,
    })

    await payloadClient.create({
      collection: 'credit-transactions',
      data: {
        user: userId,
        amount: -price,
        balanceAfter: newCredits,
        type: 'renew',
        relatedExchange: ex.id,
        reason: `\u81ea\u52a8\u7eed\u8d39\u300a${macroDoc.title}\u300b`,
      },
      overrideAccess: true,
    })

    await payloadClient.create({
      collection: 'notifications',
      data: {
        recipient: userId,
        title: '\u81ea\u52a8\u7eed\u8d39\u6210\u529f',
        body: `\u300a${macroDoc.title}\u300b\u5df2\u81ea\u52a8\u7eed\u8d39\uff0c\u6263\u9664 ${price} \u70b9\u5238\u3002\u6709\u6548\u671f\u5ef6\u81f3 ${newExpiresAt ? newExpiresAt.slice(0, 10) : '\u6c38\u4e45'}\u3002`,
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
      reason: `\u81ea\u52a8\u7eed\u8d39\u300a${macroDoc.title}\u300b\u6263\u9664 ${price} \u70b9\u5238`,
      metadata: { macroId: macroDoc.id, macroTitle: macroDoc.title, credits: newCredits },
    })

    renewed++
  }

  return {
    checked: exchanges.docs.length,
    renewed,
    failed,
  }
}
