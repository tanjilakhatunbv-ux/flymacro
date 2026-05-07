import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { dodoFetch, isDodoConfigured, type DodoCheckoutSession } from '../../../../lib/dodo'
import { success, unauthorized, badRequest, notFound, internalError } from '../../../../lib/api-response'
import { parseParam, IdParam } from '../../../../lib/validation'

export async function POST(req: Request) {
  if (!isDodoConfigured()) {
    return internalError('支付系统尚未配置', 'payment-not-configured')
  }

  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }

  const payload = await getPayload()

  let body: { packageId?: number | string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return badRequest('请求体格式错误', 'invalid-body')
  }

  const { packageId } = body
  if (!packageId) {
    return badRequest('请选择充值档次', 'missing-package')
  }

  const parsed = parseParam(IdParam, packageId)
  if (!parsed.ok) {
    return badRequest('无效的充值档次 ID', 'invalid-package-id')
  }

  const pkg = await payload
    .findByID({
      collection: 'credit-packages',
      id: parsed.data,
      depth: 0,
    })
    .catch(() => null)

  if (!pkg || !pkg.enabled) {
    return notFound('充值档次不存在或已下架', 'package-not-found')
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
          packageId: String(parsed.data),
        },
      },
    })

    return NextResponse.json(success({ checkoutUrl: session.checkout_url, sessionId: session.session_id }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : '创建支付会话失败'
    return internalError(msg, 'checkout-failed')
  }
}
