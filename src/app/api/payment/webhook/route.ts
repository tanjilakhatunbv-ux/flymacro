import { NextResponse } from 'next/server'
import { env } from '../../../../lib/env'
import { success, badRequest, unauthorized, internalError } from '../../../../lib/api-response'
import { rateLimit, getClientIP } from '../../../../lib/rate-limit'
import {
  DuplicateWebhookError,
  InvalidWebhookPayloadError,
  handlePaymentSuccess,
} from '../../../../lib/payment-service'
import crypto from 'crypto'

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

function extractId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' ? id : ''
  }
  return ''
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

  const rawAmount = (order.amount as number) ?? 0
  const amount = rawAmount / 100
  const currency = ((order.currency as string) || 'CNY').toUpperCase() as 'CNY' | 'USD'
  const checkoutId = (obj.id as string) || ''
  const productId = extractId(obj.product) || extractId(order.product)

  if (!checkoutId || !productId) {
    return badRequest('Missing required checkout fields', 'missing-checkout-fields')
  }

  try {
    const result = await handlePaymentSuccess({
      userId: Number(userId),
      packageId: Number(packageId),
      amount,
      rawAmount,
      currency,
      checkoutId,
      productId,
      meta: evt,
    })

    return NextResponse.json(success({ received: true, orderId: result.orderId }))
  } catch (err) {
    if (err instanceof DuplicateWebhookError) {
      return NextResponse.json(success({ received: true, duplicate: true }))
    }
    if (err instanceof InvalidWebhookPayloadError) {
      return badRequest('Invalid checkout payload', err.code)
    }
    return internalError('Failed to process payment')
  }
}
