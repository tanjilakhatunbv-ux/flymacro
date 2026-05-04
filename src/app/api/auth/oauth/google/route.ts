import { NextResponse } from 'next/server'
import { isGoogleOAuthConfigured, generateState, getGoogleAuthUrl } from '../../../../../lib/oauth'

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 501 })
  }

  const { searchParams } = new URL(req.url)
  const returnUrl = searchParams.get('return') || '/account'

  const state = generateState()
  const statePayload = JSON.stringify({ state, returnUrl })

  // Set state cookie (short-lived, 10 min)
  const response = NextResponse.redirect(getGoogleAuthUrl(state))
  response.cookies.set('oauth-state', statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  return response
}
