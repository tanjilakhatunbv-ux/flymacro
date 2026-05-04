import { NextResponse } from 'next/server'
import { isGitHubOAuthConfigured, generateState, getGitHubAuthUrl } from '../../../../../lib/oauth'

export async function GET(req: Request) {
  if (!isGitHubOAuthConfigured()) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 501 })
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
