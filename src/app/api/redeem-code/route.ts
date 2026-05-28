import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { badRequest, conflict, internalError, notFound, success, unauthorized } from '../../../lib/api-response'
import { normalizeRedeemCode } from '../../../lib/redeem-code-rules'
import { RedeemCodeError, redeemCodeForUser } from '../../../lib/redeem-code-service'
import { getClientIP, rateLimitWithFallback } from '../../../lib/rate-limit'
import { writeAuditLog } from '../../../lib/audit'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`redeem-code:${ip}`, [
    { max: 8, windowMs: 60_000 },
    { max: 30, windowMs: 3_600_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41', code: 'rate_limited' },
      { status: 429 },
    )
  }

  const user = await getCurrentUser()
  if (!user) return unauthorized('\u8bf7\u5148\u767b\u5f55', 'unauthenticated')

  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('\u8bf7\u6c42\u4f53\u683c\u5f0f\u9519\u8bef', 'invalid_body')
  }

  const code = normalizeRedeemCode(body.code ?? '')
  if (!code) return badRequest('\u8bf7\u8f93\u5165\u5151\u6362\u7801', 'missing_redeem_code')

  let result: Awaited<ReturnType<typeof redeemCodeForUser>>
  try {
    result = await redeemCodeForUser(user, code)
  } catch (err) {
    if (err instanceof RedeemCodeError) {
      if (err.code === 'redeem_code_not_found') return notFound(err.message, err.code)
      if (err.code === 'redeem_code_disabled' || err.code === 'redeem_code_exhausted') {
        return conflict(err.message, err.code)
      }
      return internalError(err.message, err.code)
    }

    return internalError('\u5151\u6362\u5931\u8d25', 'redeem_code_failed')
  }

  writeAuditLog({
    action: 'other',
    collection: 'redeem-codes',
    docId: result.redeemCodeId ? String(result.redeemCodeId) : undefined,
    operator: user.id,
    ip,
    reason: `\u5151\u6362\u7801\u5151\u6362 ${result.creditsGranted} \u70b9\u5238`,
    metadata: {
      redemptionId: result.redemptionId,
      creditsGranted: result.creditsGranted,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
    },
  })

  return NextResponse.json(success({
    creditsGranted: result.creditsGranted,
    balanceBefore: result.balanceBefore,
    balanceAfter: result.balanceAfter,
  }))
}
