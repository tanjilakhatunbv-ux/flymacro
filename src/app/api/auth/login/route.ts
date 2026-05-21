import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from '../../../../lib/payload'
import { rateLimitWithFallback, getClientIP, getCount, incr, del } from '../../../../lib/rate-limit'
import { success, badRequest, unauthorized, forbidden, internalError } from '../../../../lib/api-response'
import { verifyTurnstile } from '../../../../lib/turnstile'
import { signJwt } from '../../../../lib/jwt'
import { setAuthCookie } from '../../../../lib/session'
import { sql } from '@payloadcms/db-postgres'
import type { User } from '../../../../payload-types'

const FAIL_THRESHOLD = 2
const FAIL_TTL = 600 // 10 minutes

async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  return new Promise((resolve) => {
    crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (err, hashBuffer) => {
      if (err) {
        resolve(false)
        return
      }
      const storedHashBuffer = Buffer.from(hash, 'hex')
      if (hashBuffer.length === storedHashBuffer.length && crypto.timingSafeEqual(hashBuffer, storedHashBuffer)) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`login:${ip}`, [
    { max: 5, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁，请稍后再试', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { email?: string; password?: string; turnstileToken?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid_json')
  }

  const { email, password } = body

  if (!email || !password) {
    return badRequest('请填写邮箱和密码', 'missing_credentials')
  }

  // Risk-triggered Turnstile: check failure counters
  const normalizedEmail = email.toLowerCase().trim()
  const ipFailKey = `login_fail_ip:${ip}`
  const emailFailKey = `login_fail_email:${normalizedEmail}`
  const ipFails = await getCount(ipFailKey)
  const emailFails = await getCount(emailFailKey)
  const needsCaptcha = ipFails >= FAIL_THRESHOLD || emailFails >= FAIL_THRESHOLD

  if (needsCaptcha) {
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    if (turnstileSecret) {
      if (!body.turnstileToken) {
        return NextResponse.json(
          { success: false, error: '请完成人机验证后重试', code: 'captcha_required' },
          { status: 403 },
        )
      }
      const ok = await verifyTurnstile(body.turnstileToken, turnstileSecret, ip)
      if (!ok) {
        return badRequest('人机验证失败，请刷新页面重试', 'turnstile_failed')
      }
    }
  }

  const payload = await getPayload()

  try {
    // Look up user first for status checks
    const userRes = await payload.find({
      collection: 'users',
      where: { email: { equals: normalizedEmail } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (userRes.docs.length === 0) {
      await incr(ipFailKey, FAIL_TTL)
      await incr(emailFailKey, FAIL_TTL)
      return unauthorized('invalid_credentials')
    }

    const user = userRes.docs[0] as User

    // Try payload.login() first — works for verified users
    let token: string | null = null
    let passwordCorrect = false
    try {
      const result = await payload.login({
        collection: 'users',
        data: { email: normalizedEmail, password },
        depth: 0,
      })
      if (result?.token) {
        token = result.token
        passwordCorrect = true
      }
    } catch {
      // payload.login() throws for unverified users even with correct password.
      // Verify password directly using pbkdf2 against the DB-stored hash/salt.
    }

    if (!passwordCorrect) {
      // Fetch hash and salt directly from DB (not returned by payload.find)
      try {
        const hashResult = await payload.db.drizzle.execute(
          sql`SELECT hash, salt FROM users WHERE id = ${user.id}`
        )
        const rows = hashResult.rows as Array<{ hash: string; salt: string }> | undefined
        const row = rows?.[0]
        if (row?.hash && row?.salt) {
          passwordCorrect = await verifyPassword(password, row.hash, row.salt)
        }
      } catch {
        // DB query failed — treat as wrong password
      }
    }

    if (!passwordCorrect) {
      await incr(ipFailKey, FAIL_TTL)
      await incr(emailFailKey, FAIL_TTL)

      try {
        await payload.create({
          collection: 'audit-logs',
          data: {
            action: 'login_failed',
            collection: 'users',
            docId: String(user.id),
            operator: user.id,
            ip,
            reason: '密码错误',
          },
          overrideAccess: true,
        })
      } catch {
        /* ignore */
      }

      const newIpFails = ipFails + 1
      const newEmailFails = emailFails + 1
      if (newIpFails >= FAIL_THRESHOLD || newEmailFails >= FAIL_THRESHOLD) {
        return NextResponse.json(
          { success: false, error: '邮箱或密码错误，请完成人机验证后重试', code: 'captcha_required' },
          { status: 401 },
        )
      }
      return unauthorized('invalid_credentials')
    }

    // Check account status (suspended/banned users cannot log in)
    if (user.status === 'suspended') {
      return forbidden('账号已被停用，请联系客服', 'account_suspended')
    }
    if (user.status === 'banned') {
      return forbidden('账号已被封禁，请联系客服', 'account_banned')
    }

    // Clear failure counters on success
    await del(ipFailKey, emailFailKey)

    // Update login metadata
    try {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          lastLoginAt: new Date().toISOString(),
          loginCount: ((user.loginCount ?? 0) as number) + 1,
        } as never,
        overrideAccess: true,
      })
    } catch {
      /* ignore metadata update failures */
    }

    // Audit log for successful login
    try {
      await payload.create({
        collection: 'audit-logs',
        data: {
          action: 'login_success',
          collection: 'users',
          docId: String(user.id),
          operator: user.id,
          ip,
          reason: user._verified ? '登录成功' : '登录成功（未验证邮箱）',
        },
        overrideAccess: true,
      })
    } catch {
      /* ignore */
    }

    // If payload.login() returned a token (verified user), use it.
    // Otherwise sign JWT directly to bypass Payload's verify gate.
    if (!token) {
      const payloadSecret = (payload as { secret?: string }).secret ?? ''
      token = signJwt(
        { id: user.id, email: user.email, collection: 'users' },
        payloadSecret,
        { expiresInSeconds: 60 * 60 * 24 * 7 },
      )
    }

    const response = NextResponse.json(success({
      user,
      token,
      message: '登录成功',
    }))

    setAuthCookie(response, token)

    return response
  } catch {
    return internalError('登录失败，请稍后重试')
  }
}
