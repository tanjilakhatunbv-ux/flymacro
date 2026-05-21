import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { env } from '../../../../lib/env'
import { success, badRequest, unauthorized, internalError } from '../../../../lib/api-response'
import { rateLimit, getClientIP } from '../../../../lib/rate-limit'
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
  const product = (obj.product ?? {}) as Record<string, unknown>
  const customer = (obj.customer ?? {}) as Record<string, unknown>
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

  // Check for duplicate
  if (checkoutId) {
    const existing = await payload.find({
      collection: 'credit-orders',
      where: { creemCheckoutId: { equals: checkoutId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      throw new DuplicateWebhookError()
    }
  }

  let order: { id: number }
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
      throw new DuplicateWebhookError()
    }
    throw err
  }

  // Update user credits
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
  })

  const currentCredits = (user?.credits as number | undefined) ?? 0
  const newCredits = currentCredits + creditsGranted

  await payload.update({
    collection: 'users',
    id: userId,
    data: { credits: newCredits },
    overrideAccess: true,
  })

  // Create credit transaction
  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: userId,
      amount: creditsGranted,
      balanceAfter: newCredits,
      type: 'recharge',
      relatedOrder: order.id,
      reason: `充值 ¥${amount.toFixed(2)} 获得 ${creditsGranted} 积分`,
    },
    overrideAccess: true,
  })

  // Create notification
  await payload.create({
    collection: 'notifications',
    data: {
      recipient: userId,
      title: '充值成功',
      body: `你已成功充值 ${creditsGranted} 积分，当前余额 ${newCredits} 积分。`,
      link: '/account/credits',
      category: 'order',
      read: false,
    },
    overrideAccess: true,
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
