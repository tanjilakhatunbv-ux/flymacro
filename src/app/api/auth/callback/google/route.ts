import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  isGoogleOAuthConfigured,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
} from '../../../../../lib/oauth'
import { getPayload } from '../../../../../lib/payload'
import { signJwt } from '../../../../../lib/jwt'
import { rateLimit, getClientIP } from '../../../../../lib/rate-limit'
import type { User } from '../../../../../payload-types'

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 501 })
  }

  const ip = getClientIP(req)
  const limit = rateLimit(`oauth-cb:${ip}`, { max: 5, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=rate_limited', req.url),
    )
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const stateParam = searchParams.get('state')

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=oauth&message=${encodeURIComponent(error)}`, req.url),
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=missing_code_or_state', req.url),
    )
  }

  // Verify state
  const cookieStore = await cookies()
  const stateCookie = cookieStore.get('oauth-state')?.value
  if (!stateCookie) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=state_expired', req.url),
    )
  }

  let parsedState: { state: string; returnUrl: string }
  try {
    parsedState = JSON.parse(stateCookie)
  } catch {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=invalid_state', req.url),
    )
  }

  if (parsedState.state !== stateParam) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=state_mismatch', req.url),
    )
  }

  // Exchange code for token
  let accessToken: string
  try {
    const tokenData = await exchangeGoogleCode(code)
    accessToken = tokenData.access_token
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'token_exchange_failed'
    return NextResponse.redirect(
      new URL(`/login?error=oauth&message=${encodeURIComponent(msg)}`, req.url),
    )
  }

  // Fetch user info
  let googleUser: {
    id: string
    email: string
    name?: string
    picture?: string
    verified_email?: boolean
  }
  try {
    googleUser = await fetchGoogleUserInfo(accessToken)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'userinfo_failed'
    return NextResponse.redirect(
      new URL(`/login?error=oauth&message=${encodeURIComponent(msg)}`, req.url),
    )
  }

  if (!googleUser.email) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=no_email', req.url),
    )
  }

  const payload = await getPayload()

  // Find existing user by OAuth ID or email
  let user = null

  const byOAuth = await payload.find({
    collection: 'users',
    where: {
      and: [
        { oauthProvider: { equals: 'google' } },
        { oauthId: { equals: googleUser.id } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (byOAuth.docs.length > 0) {
    user = byOAuth.docs[0]
  } else {
    const byEmail = await payload.find({
      collection: 'users',
      where: { email: { equals: googleUser.email.toLowerCase() } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (byEmail.docs.length > 0) {
      user = byEmail.docs[0]
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          oauthProvider: 'google',
          oauthId: googleUser.id,
          _verified: true,
        } as never,
        overrideAccess: true,
      })
    } else {
      user = await payload.create({
        collection: 'users',
        data: {
          email: googleUser.email.toLowerCase(),
          name: googleUser.name || undefined,
          role: 'user',
          oauthProvider: 'google',
          oauthId: googleUser.id,
          _verified: true,
        } as never,
        overrideAccess: true,
      })
    }
  }

  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=user_creation_failed', req.url),
    )
  }

  const userDoc = user as User

  // Check account status
  if (userDoc.status === 'suspended') {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=account_suspended', req.url),
    )
  }
  if (userDoc.status === 'banned') {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=account_banned', req.url),
    )
  }

  // Update login metadata
  try {
    await payload.update({
      collection: 'users',
      id: userDoc.id,
      data: {
        lastLoginAt: new Date().toISOString(),
        loginCount: ((userDoc.loginCount ?? 0) as number) + 1,
      } as never,
      overrideAccess: true,
    })
  } catch {
    /* ignore metadata update failures */
  }

  // Audit log for OAuth login
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'login_success',
        collection: 'users',
        docId: String(userDoc.id),
        operator: userDoc.id,
        ip,
        reason: 'Google OAuth 登录',
      },
      overrideAccess: true,
    })
  } catch {
    /* ignore */
  }

  // Generate JWT directly — no temporary password needed
  const payloadSecret = (payload as { secret?: string }).secret ?? ''
  const jwtToken = signJwt(
    {
      id: userDoc.id,
      email: userDoc.email,
      collection: 'users',
    },
    payloadSecret,
    { expiresInSeconds: 60 * 60 * 24 * 7 },
  )

  const response = NextResponse.redirect(
    new URL(parsedState.returnUrl, req.url),
  )

  response.cookies.set('payload-token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  response.cookies.delete('oauth-state')

  return response
}
