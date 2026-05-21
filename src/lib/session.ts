import type { NextResponse } from 'next/server'

export const AUTH_COOKIE_NAME = 'payload-token'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const isProduction = process.env.NODE_ENV === 'production'

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(AUTH_COOKIE_NAME)
}
