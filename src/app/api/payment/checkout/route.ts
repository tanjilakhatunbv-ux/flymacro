import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { isCreemConfigured } from '../../../../lib/creem'
import { success, unauthorized, badRequest, notFound, internalError } from '../../../../lib/api-response'
import { parseParam, IdParam } from '../../../../lib/validation'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { createCheckoutSessionForUser } from '../../../../lib/payment-service'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`checkout:${ip}`, [
    { max: 5, windowMs: 60_000 },
    { max: 20, windowMs: 3_600_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41', code: 'rate_limited' },
      { status: 429 },
    )
  }

  if (!isCreemConfigured()) {
    return internalError('\u652f\u4ed8\u7cfb\u7edf\u5c1a\u672a\u914d\u7f6e', 'payment-not-configured')
  }

  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }

  let body: { packageId?: number | string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return badRequest('\u8bf7\u6c42\u4f53\u683c\u5f0f\u9519\u8bef', 'invalid-body')
  }

  const { packageId } = body
  if (!packageId) {
    return badRequest('\u8bf7\u9009\u62e9\u70b9\u5238\u5305', 'missing-package')
  }

  const parsed = parseParam(IdParam, packageId)
  if (!parsed.ok) {
    return badRequest('\u65e0\u6548\u7684\u70b9\u5238\u5305 ID', 'invalid-package-id')
  }

  try {
    const result = await createCheckoutSessionForUser({ user, packageId: parsed.data })
    if ('error' in result) {
      return notFound('\u70b9\u5238\u5305\u4e0d\u5b58\u5728\u6216\u5df2\u4e0b\u67b6', result.error)
    }
    return NextResponse.json(success({ checkoutUrl: result.checkoutUrl, sessionId: result.sessionId }))
  } catch (err) {
    const message = err instanceof Error ? err.message : '\u521b\u5efa\u652f\u4ed8\u4f1a\u8bdd\u5931\u8d25'
    return internalError(message, 'checkout-failed')
  }
}
