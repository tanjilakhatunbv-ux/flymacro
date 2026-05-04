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

  console.log('[Webhook] Raw body:', payloadText.slice(0, 2000))

  // Verify signature if secret is configured
  if (secret) {
    const signature = req.headers.get('x-dodo-signature')
      || req.headers.get('x-webhook-signature')
      || req.headers.get('stripe-signature')
      || req.headers.get('x-webhook-signature-256')
    console.log('[Webhook] Signature header:', signature ? `${signature.slice(0, 30)}...` : 'missing')
    if (!signature) {
      console.warn('[Webhook] Missing signature header — processing anyway in test mode')
      if (process.env.DODO_MODE !== 'test_mode') {
        return NextResponse.json({ error: 'missing-signature' }, { status: 401 })
      }
    } else {
      const isValid = verifySignature(payloadText, signature, secret)
      console.log('[Webhook] Signature valid:', isValid)
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

  const evt = event as Record<string, unknown>

  // Try multiple possible event type field names
  const eventType =
    (evt.type as string | undefined)
    || (evt.event_type as string | undefined)
    || (evt.event as string | undefined)
    || ''

  console.log(`[Webhook] Parsed event type: "${eventType}"`)
  console.log('[Webhook] Top-level keys:', Object.keys(evt).join(', '))

  // Try to find the actual data object from various possible locations
  let data = evt
  if (evt.data && typeof evt.data === 'object') {
    const dataObj = evt.data as Record<string, unknown>
    if (dataObj.object && typeof dataObj.object === 'object') {
      data = dataObj.object as Record<string, unknown>
      console.log('[Webhook] Using data.object structure')
    } else {
      data = dataObj
      console.log('[Webhook] Using data structure directly')
    }
  }

  console.log('[Webhook] Data keys:', Object.keys(data).join(', '))
  console.log('[Webhook] Data.metadata:', JSON.stringify((data.metadata as Record<string, string>) ?? null))

  if (!RELEVANT_EVENTS.has(eventType)) {
    console.log(`[Webhook] Event type "${eventType}" not in relevant events, skipping`)
    return NextResponse.json({ received: true })
  }

  try {
    await handlePaymentSuccess(data)
  } catch (err) {
    console.error('[Webhook] Error handling payment success:', err)
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
  console.log('[Webhook] handlePaymentSuccess called with keys:', Object.keys(data).join(', '))

  // Try multiple possible metadata locations
  let metadata: Record<string, string> = {}

  if (data.metadata && typeof data.metadata === 'object') {
    metadata = data.metadata as Record<string, string>
    console.log('[Webhook] Found metadata at data.metadata')
  } else if (data.object && typeof data.object === 'object' && (data.object as Record<string, unknown>).metadata) {
    metadata = ((data.object as Record<string, unknown>).metadata as Record<string, string>) ?? {}
    console.log('[Webhook] Found metadata at data.object.metadata')
  } else if (data.custom_metadata && typeof data.custom_metadata === 'object') {
    metadata = data.custom_metadata as Record<string, string>
    console.log('[Webhook] Found metadata at data.custom_metadata')
  } else if (data.checkout && typeof data.checkout === 'object' && (data.checkout as Record<string, unknown>).metadata) {
    metadata = ((data.checkout as Record<string, unknown>).metadata as Record<string, string>) ?? {}
    console.log('[Webhook] Found metadata at data.checkout.metadata')
  }

  console.log('[Webhook] Extracted metadata:', JSON.stringify(metadata))

  const userId = metadata.userId
  const packageId = metadata.packageId

  if (!userId || !packageId) {
    console.warn('[Webhook] Missing metadata fields', metadata)
    // Also log the full data for debugging
    console.warn('[Webhook] Full data for debugging:', JSON.stringify(data).slice(0, 2000))
    return
  }

  console.log(`[Webhook] Processing payment for userId=${userId}, packageId=${packageId}`)

  // Try multiple possible amount locations
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

  const amount = rawAmount > 10000 ? rawAmount / 100 : rawAmount
  console.log(`[Webhook] Amount: raw=${rawAmount}, processed=${amount}`)

  const currency = (
    (data.currency as string)
    || (data.currency_code as string)
    || 'CNY'
  ).toUpperCase()

  const sessionId = (
    (data.id as string)
    || (data.session_id as string)
    || (data.checkout_id as string)
    || (data.payment_id as string)
    || ''
  ) as string

  console.log(`[Webhook] currency=${currency}, sessionId=${sessionId}`)

  const payload = await getPayload()

  // Check for existing credit-order to avoid duplicates
  console.log('[Webhook] Checking for existing order...')
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
  console.log('[Webhook] Fetching credit package...')
  const pkg = await payload.findByID({
    collection: 'credit-packages',
    id: Number(packageId),
    depth: 0,
  }).catch((err) => {
    console.warn('[Webhook] Failed to fetch package:', err)
    return null
  })

  const creditsGranted = pkg?.creditsGranted ?? Math.floor(amount)
  console.log(`[Webhook] creditsGranted=${creditsGranted} (from package=${pkg?.creditsGranted ?? 'N/A'}, fallback=${Math.floor(amount)})`)

  // Create credit order
  console.log('[Webhook] Creating credit order...')
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
  console.log(`[Webhook] Created credit order id=${order.id}`)

  // Update user credits
  console.log('[Webhook] Fetching user...')
  const user = await payload.findByID({
    collection: 'users',
    id: Number(userId),
    depth: 0,
  })

  const currentCredits = (user?.credits as number) ?? 0
  const newCredits = currentCredits + creditsGranted
  console.log(`[Webhook] User credits: ${currentCredits} -> ${newCredits}`)

  await payload.update({
    collection: 'users',
    id: Number(userId),
    data: { credits: newCredits } as any,
    overrideAccess: true,
  })
  console.log('[Webhook] User credits updated')

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
  console.log('[Webhook] Credit transaction created')

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
  console.log('[Webhook] Notification created')

  console.log(`[Webhook] ✅ Complete: Created credit order ${order.id} for user ${userId}, +${creditsGranted} credits`)
}
