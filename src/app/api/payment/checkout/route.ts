import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { creemFetch, isCreemConfigured, type CreemCheckoutSession } from '../../../../lib/creem'
import { success, unauthorized, badRequest, notFound, internalError } from '../../../../lib/api-response'
import { parseParam, IdParam } from '../../../../lib/validation'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`checkout:${ip}`, [
    { max: 5, windowMs: 60_000 },
    { max: 20, windowMs: 3_600_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁', code: 'rate_limited' },
      { status: 429 },
    )
  }

  if (!isCreemConfigured()) {
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

  const successUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/credits?paid=success`

  try {
    const session = await creemFetch<CreemCheckoutSession>('/checkouts', {
      method: 'POST',
      body: {
        product_id: pkg.creemProductId,
        success_url: successUrl,
        customer: {
          email: user.email,
        },
        metadata: {
          userId: String(user.id),
          packageId: String(parsed.data),
        },
      },
    })

    return NextResponse.json(success({ checkoutUrl: session.checkout_url, sessionId: session.id }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : '创建支付会话失败'
    return internalError(msg, 'checkout-failed')
  }
}
