import { sql } from '@payloadcms/db-postgres'
import { getPayload } from './payload'
import { creemFetch, type CreemCheckoutSession } from './creem'
import { writeAuditLog } from './audit'
import type { User } from '../payload-types'

type Payload = Awaited<ReturnType<typeof getPayload>>

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FM${ts}${rand}`
}

export class DuplicateWebhookError extends Error {
  constructor() {
    super('Duplicate webhook')
    this.name = 'DuplicateWebhookError'
  }
}

export class InvalidWebhookPayloadError extends Error {
  constructor(public readonly code: string) {
    super(code)
    this.name = 'InvalidWebhookPayloadError'
  }
}

export async function createCheckoutSessionForUser(
  data: { user: User; packageId: number },
  payload?: Payload,
): Promise<{ checkoutUrl: string; sessionId: string } | { error: 'package-not-found' }> {
  const payloadClient = payload ?? await getPayload()
  const pkg = await payloadClient
    .findByID({
      collection: 'credit-packages',
      id: data.packageId,
      depth: 0,
    })
    .catch(() => null)

  if (!pkg || !pkg.enabled) {
    return { error: 'package-not-found' }
  }

  const successUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/credits?paid=success`
  const session = await creemFetch<CreemCheckoutSession>('/checkouts', {
    method: 'POST',
    body: {
      product_id: pkg.creemProductId,
      success_url: successUrl,
      customer: {
        email: data.user.email,
      },
      metadata: {
        userId: String(data.user.id),
        packageId: String(data.packageId),
      },
    },
  })

  return { checkoutUrl: session.checkout_url, sessionId: session.id }
}

function assertWebhookMatchesPackage(params: {
  pkg: { amount?: number | null; currency?: string | null; creemProductId?: string | null }
  rawAmount: number
  currency: string
  productId: string
}) {
  const { pkg, rawAmount, currency, productId } = params
  const expectedProductId = pkg.creemProductId ?? ''
  if (!expectedProductId || productId !== expectedProductId) {
    throw new InvalidWebhookPayloadError('product-mismatch')
  }

  const expectedCurrency = (pkg.currency || 'CNY').toUpperCase()
  if (currency !== expectedCurrency) {
    throw new InvalidWebhookPayloadError('currency-mismatch')
  }

  const expectedMinorAmount = Math.round(Number(pkg.amount ?? 0) * 100)
  if (!Number.isFinite(rawAmount) || rawAmount <= 0 || rawAmount !== expectedMinorAmount) {
    throw new InvalidWebhookPayloadError('amount-mismatch')
  }
}

export interface PaymentSuccessParams {
  userId: number
  packageId: number
  amount: number
  rawAmount: number
  currency: 'CNY' | 'USD'
  checkoutId: string
  productId: string
  meta: Record<string, unknown>
}

export async function handlePaymentSuccess(
  params: PaymentSuccessParams,
  payload?: Payload,
): Promise<{ orderId: number }> {
  const { userId, packageId, amount, rawAmount, currency, checkoutId, productId, meta } = params
  const payloadClient = payload ?? await getPayload()

  const pkg = await payloadClient
    .findByID({
      collection: 'credit-packages',
      id: packageId,
      depth: 0,
    })
    .catch(() => null)

  if (!pkg || !pkg.enabled) {
    throw new InvalidWebhookPayloadError('package-not-found')
  }

  assertWebhookMatchesPackage({ pkg, rawAmount, currency, productId })

  const creditsGranted = pkg?.creditsGranted ?? Math.floor(amount)
  let newCredits: number
  let order: { id: number }

  await payloadClient.db.drizzle.execute(sql`BEGIN`)

  try {
    if (checkoutId) {
      const dupRes = await payloadClient.db.drizzle.execute(
        sql`SELECT id FROM credit_orders WHERE creem_checkout_id = ${checkoutId} LIMIT 1`,
      )
      const dupRows = dupRes.rows as Array<{ id: number }> | undefined
      if (dupRows && dupRows.length > 0) {
        throw new DuplicateWebhookError()
      }
    }

    const userRes = await payloadClient.db.drizzle.execute(
      sql`SELECT id FROM users WHERE id = ${userId} LIMIT 1`,
    )
    const userRows = userRes.rows as Array<{ id: number }> | undefined
    if (!userRows || userRows.length === 0) {
      throw new InvalidWebhookPayloadError('user-not-found')
    }

    try {
      order = await payloadClient.create({
        collection: 'credit-orders',
        data: {
          orderNumber: generateOrderNumber(),
          user: userId,
          amount,
          currency,
          creditsGranted,
          status: 'paid',
          creemCheckoutId: checkoutId,
          paidAt: new Date().toISOString(),
          meta,
        },
        overrideAccess: true,
      })
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new DuplicateWebhookError()
      }
      throw err
    }

    const creditResult = await payloadClient.db.drizzle.execute(
      sql`UPDATE users SET credits = credits + ${creditsGranted} WHERE id = ${userId} RETURNING credits`,
    )
    const creditRows = creditResult.rows as Array<{ credits: number }> | undefined
    newCredits = creditRows?.[0]?.credits ?? creditsGranted

    await payloadClient.db.drizzle.execute(sql`COMMIT`)
  } catch (err) {
    await payloadClient.db.drizzle.execute(sql`ROLLBACK`).catch(() => {})
    throw err
  }

  await payloadClient.create({
    collection: 'credit-transactions',
    data: {
      user: userId,
      amount: creditsGranted,
      balanceAfter: newCredits,
      type: 'recharge',
      relatedOrder: order.id,
      reason: `\u8d2d\u4e70\u70b9\u5238\u5305 \u00a5${amount.toFixed(2)}\uff0c\u83b7\u5f97 ${creditsGranted} \u70b9\u5238`,
    },
    overrideAccess: true,
  })

  await payloadClient.create({
    collection: 'notifications',
    data: {
      recipient: userId,
      title: '\u8d2d\u4e70\u6210\u529f',
      body: `\u4f60\u5df2\u6210\u529f\u83b7\u5f97 ${creditsGranted} \u70b9\u5238\uff0c\u5f53\u524d\u4f59\u989d ${newCredits} \u70b9\u5238\u3002`,
      link: '/account/credits',
      category: 'order',
      read: false,
    },
    overrideAccess: true,
  })

  writeAuditLog({
    action: 'payment_received',
    collection: 'credit-orders',
    docId: String(order.id),
    operator: userId,
    ip: 'webhook',
    reason: `\u8d2d\u4e70\u70b9\u5238\u5305 \u00a5${amount.toFixed(2)}\uff0c\u83b7\u5f97 ${creditsGranted} \u70b9\u5238`,
    metadata: { checkoutId, creditsGranted, currency },
  })

  return { orderId: order.id }
}

function isUniqueConstraintError(err: unknown): boolean {
  if (!err) return false
  const msg = String(err)
  return (
    msg.includes('unique constraint') ||
    msg.includes('duplicate key') ||
    msg.includes('UNIQUE constraint failed') ||
    msg.includes('already exists')
  )
}
