import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import crypto from 'crypto'

// DodoPayments webhook events we care about
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

export async function POST(req: Request) {
  const secret = process.env.DODO_WEBHOOK_SECRET
  const payloadText = await req.text()

  // Verify signature if secret is configured
  if (secret) {
    const signature = req.headers.get('x-dodo-signature')
      || req.headers.get('x-webhook-signature')
      || req.headers.get('stripe-signature')
      || req.headers.get('x-webhook-signature-256')
    if (!signature) {
      console.warn('[Webhook] Missing signature header — processing anyway in test mode')
      // In test_mode DodoPayments may not send signatures; trust the payload if URL is secret
      if (process.env.DODO_MODE !== 'test_mode') {
        return NextResponse.json({ error: 'missing-signature' }, { status: 401 })
      }
    } else {
      const isValid = verifySignature(payloadText, signature, secret)
      if (!isValid) {
        console.warn('[Webhook] Invalid signature')
        return NextResponse.json({ error: 'invalid-signature' }, { status: 401 })
      }
    }
  }

  let event: unknown
  try {
    event = JSON.parse(payloadText)
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }

  const evt = event as {
    type?: string
    data?: {
      object?: Record<string, unknown>
    }
  }
  const eventType = evt.type ?? ''
  const data = evt.data?.object ?? (event as Record<string, unknown>)

  console.log(`[Webhook] Received event: ${eventType}`)

  if (!RELEVANT_EVENTS.has(eventType)) {
    return NextResponse.json({ received: true })
  }

  try {
    await handlePaymentSuccess(data as Record<string, unknown>)
  } catch (err) {
    console.error('[Webhook] Error handling payment success:', err)
    // Return 500 so DodoPayments retries
    return NextResponse.json({ error: 'internal-error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  // Try common webhook signature formats
  // 1. Stripe-style: t=...,v1=...
  if (signature.includes('v1=')) {
    const signed = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return signature.includes(signed)
  }
  // 2. Simple HMAC hex
  const signed = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  if (signed === signature) return true
  // 3. Base64 HMAC
  const signedB64 = crypto.createHmac('sha256', secret).update(payload).digest('base64')
  if (signedB64 === signature) return true
  return false
}

async function handlePaymentSuccess(data: Record<string, unknown>) {
  const metadata = (
    (data.metadata as Record<string, string>) ??
    ((data.object as Record<string, unknown>)?.metadata as Record<string, string>) ??
    {}
  )
  const userId = metadata.userId
  const packageId = metadata.packageId

  if (!userId || !packageId) {
    console.warn('[Webhook] Missing metadata fields', metadata)
    return
  }

  let rawAmount = (data.amount ?? 0) as number
  if (rawAmount === 0) {
    rawAmount = ((data.object as Record<string, unknown>)?.amount ?? 0) as number
  }
  const amount = rawAmount > 10000 ? rawAmount / 100 : rawAmount

  const currency = ((data.currency ?? 'CNY') as string).toUpperCase()
  const sessionId = (data.id ?? data.session_id ?? '') as string

  const payload = await getPayload()

  // Check for existing credit-order to avoid duplicates
  const existingOrders = await payload.find({
    collection: 'credit-orders',
    where: {
      and: [
        { user: { equals: Number(userId) } },
        { dodoCheckoutId: { equals: sessionId } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existingOrders.docs.length > 0) {
    console.log('[Webhook] Credit order already exists, skipping')
    return
  }

  // Fetch package to get creditsGranted
  const pkg = await payload.findByID({
    collection: 'credit-packages',
    id: Number(packageId),
    depth: 0,
  }).catch(() => null)

  const creditsGranted = pkg?.creditsGranted ?? Math.floor(amount)

  // Create credit order
  const order = await payload.create({
    collection: 'credit-orders',
    data: {
      orderNumber: generateOrderNumber(),
      user: Number(userId),
      amount,
      currency: currency as 'CNY' | 'USD',
      creditsGranted,
      status: 'paid',
      dodoCheckoutId: sessionId,
      paidAt: new Date().toISOString(),
      meta: data,
    } as any,
    overrideAccess: true,
  })

  // Update user credits
  const user = await payload.findByID({
    collection: 'users',
    id: Number(userId),
    depth: 0,
  })

  const currentCredits = (user?.credits as number) ?? 0
  const newCredits = currentCredits + creditsGranted

  await payload.update({
    collection: 'users',
    id: Number(userId),
    data: { credits: newCredits } as any,
    overrideAccess: true,
  })

  // Create credit transaction
  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: Number(userId),
      amount: creditsGranted,
      balanceAfter: newCredits,
      type: 'recharge',
      relatedOrder: order.id,
      reason: `充值 ¥${amount.toFixed(2)} 获得 ${creditsGranted} 积分`,
    } as any,
    overrideAccess: true,
  })

  // Create notification for user
  await payload.create({
    collection: 'notifications',
    data: {
      recipient: Number(userId),
      title: '充值成功',
      body: `你已成功充值 ${creditsGranted} 积分，当前余额 ${newCredits} 积分。`,
      link: '/account/credits',
      category: 'order',
      read: false,
    } as any,
    overrideAccess: true,
  })

  console.log(`[Webhook] Created credit order ${order.id} for user ${userId}, +${creditsGranted} credits`)
}
