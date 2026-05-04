import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { dodoFetch, isDodoConfigured, type DodoCheckoutSession } from '../../../../lib/dodo'

export async function POST(req: Request) {
  if (!isDodoConfigured()) {
    return NextResponse.json(
      { error: 'payment-not-configured', message: '支付系统尚未配置。' },
      { status: 501 },
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: 'unauthenticated', message: '请先登录。' },
      { status: 401 },
    )
  }

  let body: { packageId?: number | string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json(
      { error: 'invalid-body', message: '请求体格式错误。' },
      { status: 400 },
    )
  }

  const { packageId } = body
  if (!packageId) {
    return NextResponse.json(
      { error: 'missing-package', message: '请选择充值档次。' },
      { status: 400 },
    )
  }

  const payload = await getPayload()

  const pkg = await payload.findByID({
    collection: 'credit-packages',
    id: packageId,
    depth: 0,
  }).catch(() => null)

  if (!pkg || !pkg.enabled) {
    return NextResponse.json(
      { error: 'package-not-found', message: '充值档次不存在或已下架。' },
      { status: 404 },
    )
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/credits?paid=success`
  const cancelUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/credits?paid=cancel`

  try {
    const session = await dodoFetch<DodoCheckoutSession>('/checkouts', {
      method: 'POST',
      body: {
        product_cart: [{ product_id: pkg.dodoProductId, quantity: 1 }],
        customer: {
          email: user.email,
          name: user.name || user.email.split('@')[0],
        },
        billing_address: {
          country: 'CN',
        },
        return_url: returnUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: String(user.id),
          packageId: String(packageId),
        },
      },
    })

    return NextResponse.json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '创建支付会话失败'
    console.error('[DodoPayments checkout error]', err)
    return NextResponse.json(
      { error: 'checkout-failed', message: msg },
      { status: 500 },
    )
  }
}
