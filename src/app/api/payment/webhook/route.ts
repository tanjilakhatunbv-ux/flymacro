import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { env } from '../../../../lib/env'
import { success, badRequest, unauthorized, internalError } from '../../../../lib/api-response'
import { rateLimit, getClientIP } from '../../../../lib/rate-limit'
import crypto from 'crypto'

const RELEVANT_EVENTS = new Set([
  'payment.succeeded',
  'checkout.session.completed',
  'payment.success',
])

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FM${ts}${rand}`
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const signedHex = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  // Handle v1= prefix format (Stripe-style)
  if (signature.includes('v1=')) {
    const token = signature.replace('v1=', '')
    return timingSafeEqual(token, signedHex)
  }

  // Try hex comparison
  if (timingSafeEqual(signature, signedHex)) return true

  // Try base64 comparison
  const signedB64 = crypto.createHmac('sha256', secret).update(payload).digest('base64')
  if (timingSafeEqual(signature, signedB64)) return true

  return false
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function POST(req: Request) {
  // Rate limit by IP
  const ip = getClientIP(req)
  const limit = rateLimit(`webhook:${ip}`, { max: 20, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  const secret = env.DODO_WEBHOOK_SECRET
  const payloadText = await req.text()

  if (secret) {
    const signature =
      req.headers.get('x-dodo-signature') ||
      req.headers.get('x-webhook-signature') ||
      req.headers.get('stripe-signature') ||
      req.headers.get('x-webhook-signature-256')

    if (!signature) {
      if (env.DODO_MODE !== 'test_mode') {
        return unauthorized('missing-signature')
      }
    } else {
      const isValid = verifySignature(payloadText, signature, secret)
      if (!isValid) {
        return unauthorized('invalid-signature')
      }
    }
  }

  let event: unknown
  try {
    event = JSON.parse(payloadText)
  } catch {
    return badRequest('Invalid JSON payload', 'invalid-json')
  }

  const evt = event as Record<string, unknown>

  const eventType =
    (evt.type as string | undefined) ||
    (evt.event_type as string | undefined) ||
    (evt.event as string | undefined) ||
    ''

  if (!RELEVANT_EVENTS.has(eventType)) {
    return NextResponse.json(success({ received: true, ignored: true }))
  }

  let data = evt
  if (evt.data && typeof evt.data === 'object') {
    const dataObj = evt.data as Record<string, unknown>
    if (dataObj.object && typeof dataObj.object === 'object') {
      data = dataObj.object as Record<string, unknown>
    } else {
      data = dataObj
    }
  }

  const metadata = extractMetadata(data)

  const userId = metadata.userId
  const packageId = metadata.packageId

  if (!userId || !packageId) {
    return badRequest('Missing required metadata fields', 'missing-metadata')
  }

  let rawAmount = 0
  if (typeof data.amount === 'number') {
    rawAmount = data.amount
  } else if (typeof data.total_amount === 'number') {
    rawAmount = data.total_amount
  } else if (data.object && typeof (data.object as Record<string, unknown>).amount === 'number') {
    rawAmount = (data.object as Record<string, unknown>).amount as number
  } else if (data.payment && typeof (data.payment as Record<string, unknown>).amount === 'number') {
    rawAmount = (data.payment as Record<string, unknown>).amount as number
  }

  // DodoPayments may return amounts in either major or minor units depending on
  // the event type and mode. We use a heuristic: values larger than what any
  // reasonable package costs in major units are treated as minor (cents) and
  // divided by 100.
  const amount = rawAmount > 10000 ? rawAmount / 100 : rawAmount

  const currency = (
    (data.currency as string) ||
    (data.currency_code as string) ||
    'CNY'
  ).toUpperCase()

  const sessionId = (
    (data.id as string) ||
    (data.session_id as string) ||
    (data.checkout_id as string) ||
    (data.payment_id as string) ||
    ''
  )

  try {
    const result = await handlePaymentSuccess({
      userId: Number(userId),
      packageId: Number(packageId),
      amount,
      currency: currency as 'CNY' | 'USD',
      sessionId,
      meta: data,
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

function extractMetadata(data: Record<string, unknown>): Record<string, string> {
  if (data.metadata && typeof data.metadata === 'object') {
    return data.metadata as Record<string, string>
  }
  if (data.object && typeof data.object === 'object' && (data.object as Record<string, unknown>).metadata) {
    return ((data.object as Record<string, unknown>).metadata as Record<string, string>) ?? {}
  }
  if (data.custom_metadata && typeof data.custom_metadata === 'object') {
    return data.custom_metadata as Record<string, string>
  }
  if (data.checkout && typeof data.checkout === 'object' && (data.checkout as Record<string, unknown>).metadata) {
    return ((data.checkout as Record<string, unknown>).metadata as Record<string, string>) ?? {}
  }
  return {}
}

interface PaymentSuccessParams {
  userId: number
  packageId: number
  amount: number
  currency: 'CNY' | 'USD'
  sessionId: string
  meta: Record<string, unknown>
}

async function handlePaymentSuccess(params: PaymentSuccessParams): Promise<{ orderId: number }> {
  const { userId, packageId, amount, currency, sessionId, meta } = params
  const payload = await getPayload()

  // Fetch package to get creditsGranted
  const pkg = await payload
    .findByID({
      collection: 'credit-packages',
      id: packageId,
      depth: 0,
    })
    .catch(() => null)

  const creditsGranted = pkg?.creditsGranted ?? Math.floor(amount)

  // Check for existing order with same session id to prevent duplicate webhooks
  if (sessionId) {
    const existing = await payload.find({
      collection: 'credit-orders',
      where: { dodoCheckoutId: { equals: sessionId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      throw new DuplicateWebhookError()
    }
  }

  // Attempt to create credit order — unique constraint on dodoCheckoutId prevents duplicates
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
        dodoCheckoutId: sessionId,
        paidAt: new Date().toISOString(),
        meta,
      },
      overrideAccess: true,
    })
  } catch (err) {
    // Check if this is a unique constraint violation on dodoCheckoutId
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

  // Create notification for user
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
