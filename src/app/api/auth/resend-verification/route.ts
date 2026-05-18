import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { success, unauthorized, internalError } from '../../../../lib/api-response'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('请先登录', 'not_authenticated')
  }

  if (user._verified) {
    return NextResponse.json(success({ alreadyVerified: true }))
  }

  const limit = await rateLimitWithFallback(`resend_verify:${user.id}`, [
    { max: 1, windowMs: 60_000 },
    { max: 5, windowMs: 3_600_000 },
    { max: 10, windowMs: 86_400_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁，请稍后再试', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  const payload = await getPayload()
  const ip = getClientIP(req)

  try {
    const token = randomBytes(32).toString('hex')

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        _verificationToken: token,
      } as never,
      overrideAccess: true,
    })

    const verifyUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`

    await payload.sendEmail({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@flymacro.qzz.io',
      to: user.email,
      subject: '验证你的邮箱地址',
      html: `<p>你好 ${user.email ?? ''}，</p>
<p>请点击下方链接验证你的邮箱：</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>该链接 24 小时内有效。</p>`,
    })

    // Audit log
    try {
      await payload.create({
        collection: 'audit-logs',
        data: {
          action: 'resend_verification',
          collection: 'users',
          docId: String(user.id),
          operator: user.id,
          ip,
          reason: '用户请求重发验证邮件',
        },
        overrideAccess: true,
      })
    } catch {
      /* ignore */
    }

    return NextResponse.json(success({ sent: true }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : '发送失败'
    return internalError(msg, 'send_email_failed')
  }
}
