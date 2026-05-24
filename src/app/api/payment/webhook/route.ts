import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { env } from '../../../../lib/env'
import { success, badRequest, unauthorized, internalError } from '../../../../lib/api-response'
import { rateLimit, getClientIP } from '../../../../lib/rate-limit'
import { writeAuditLog } from '../../../../lib/audit'
import { sql } from '@payloadcms/db-postgres'
import crypto from 'crypto'

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FM${ts}${rand}`
}

function verifyCreemSignature(payload: string, signature: string, secret: string): boolean {
  const signedHex = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return timingSafeEqual(signature, signedHex)
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = rateLimit(`webhook:${ip}`, { max: 20, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  const secret = env.CREEM_WEBHOOK_SECRET
  const payloadText = await req.text()

  // Verify signature
  if (secret) {
    const signature = req.headers.get('creem-signature')
    if (!signature) {
      return unauthorized('missing-signature')
    }
    if (!verifyCreemSignature(payloadText, signature, secret)) {
      return unauthorized('invalid-signature')
    }
  } else if (process.env.NODE_ENV === 'production') {
    return unauthorized('webhook-secret-not-configured')
  }

  let event: unknown
  try {
    event = JSON.parse(payloadText)
  } catch {
    return badRequest('Invalid JSON payload', 'invalid-json')
  }

  const evt = event as Record<string, unknown>
  const eventType = evt.eventType as string | undefined

  if (eventType !== 'checkout.completed') {
    return NextResponse.json(success({ received: true, ignored: true }))
  }

  const obj = (evt.object ?? {}) as Record<string, unknown>
  const order = (obj.order ?? {}) as Record<string, unknown>
  const metadata = (obj.metadata ?? {}) as Record<string, string>

  const userId = metadata.userId
  const packageId = metadata.packageId

  if (!userId || !packageId) {
    return badRequest('Missing required metadata fields', 'missing-metadata')
  }

  // Creem amounts are in minor units (cents)
  const rawAmount = (order.amount as number) ?? 0
  const amount = rawAmount / 100

  const currency = ((order.currency as string) || 'CNY').toUpperCase() as 'CNY' | 'USD'

  const checkoutId = (obj.id as string) || ''

  try {
    const result = await handlePaymentSuccess({
      userId: Number(userId),
      packageId: Number(packageId),
      amount,
      currency,
      checkoutId,
      meta: evt,
    })

    return NextResponse.json(success({ received: true, orderId: result.orderId }))
  } catch (err) {
    if (err instanceof DuplicateWebhookError) {
      return NextResponse.json(success({ received: true, duplicate: true }))
    }
    return internalError('Failed to process payment')
  }
}

class DuplicateWebhookError extends Error {
  constructor() {
    super('Duplicate webhook')
    this.name = 'DuplicateWebhookError'
  }
}

interface PaymentSuccessParams {
  userId: number
  packageId: number
  amount: number
  currency: 'CNY' | 'USD'
  checkoutId: string
  meta: Record<string, unknown>
}

async function handlePaymentSuccess(params: PaymentSuccessParams): Promise<{ orderId: number }> {
  const { userId, packageId, amount, currency, checkoutId, meta } = params
  const payload = await getPayload()

  const pkg = await payload
    .findByID({
      collection: 'credit-packages',
      id: packageId,
      depth: 0,
    })
    .catch(() => null)

  const creditsGranted = pkg?.creditsGranted ?? Math.floor(amount)

  // Transaction: duplicate check + order creation + credit update
  let newCredits: number
  let order: { id: number }

  await payload.db.drizzle.execute(sql`BEGIN`)

  try {
    // Check for duplicate within transaction
    if (checkoutId) {
      const dupRes = await payload.db.drizzle.execute(
        sql`SELECT id FROM credit_orders WHERE creem_checkout_id = ${checkoutId} LIMIT 1`
      )
      const dupRows = dupRes.rows as Array<{ id: number }> | undefined
      if (dupRows && dupRows.length > 0) {
        await payload.db.drizzle.execute(sql`ROLLBACK`)
        throw new DuplicateWebhookError()
      }
    }

    // Create order via payload (within transaction)
    try {
      order = await payload.create({
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
        await payload.db.drizzle.execute(sql`ROLLBACK`)
        throw new DuplicateWebhookError()
      }
      throw err
    }

    // Atomic credit update within same transaction
    const creditResult = await payload.db.drizzle.execute(
      sql`UPDATE users SET credits = credits + ${creditsGranted} WHERE id = ${userId} RETURNING credits`
    )
    const creditRows = creditResult.rows as Array<{ credits: number }> | undefined
    newCredits = creditRows?.[0]?.credits ?? creditsGranted

    await payload.db.drizzle.execute(sql`COMMIT`)
  } catch (err) {
    await payload.db.drizzle.execute(sql`ROLLBACK`).catch(() => {})
    if (err instanceof DuplicateWebhookError) throw err
    throw err
  }

  // Non-critical side effects (outside transaction)
  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: userId,
      amount: creditsGranted,
      balanceAfter: newCredits,
      type: 'recharge',
      relatedOrder: order.id,
      reason: `购买点券包 ¥${amount.toFixed(2)}，获得 ${creditsGranted} 点券`,
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'notifications',
    data: {
      recipient: userId,
      title: '购买成功',
      body: `你已成功获得 ${creditsGranted} 点券，当前余额 ${newCredits} 点券。`,
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
    reason: `购买点券包 ¥${amount.toFixed(2)}，获得 ${creditsGranted} 点券`,
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
