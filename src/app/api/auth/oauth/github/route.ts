import { NextResponse } from 'next/server'
import { authLoginUrl } from '../../../../../lib/auth-urls'
import { isGitHubOAuthConfigured, generateState, getGitHubAuthUrl } from '../../../../../lib/oauth'
import { rateLimit, getClientIP } from '../../../../../lib/rate-limit'

export async function GET(req: Request) {
  if (!isGitHubOAuthConfigured()) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 501 })
  }

  const ip = getClientIP(req)
  const limit = rateLimit(`oauth:${ip}`, { max: 5, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.redirect(
      new URL(authLoginUrl('rate_limited'), req.url),
    )
  }

  const { searchParams } = new URL(req.url)
  const returnUrl = searchParams.get('return') || '/account'

  const state = generateState()
  const statePayload = JSON.stringify({ state, returnUrl })

  const response = NextResponse.redirect(getGitHubAuthUrl(state))
  response.cookies.set('oauth-state', statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  return response
}
