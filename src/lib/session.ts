import type { NextResponse } from 'next/server'

export const AUTH_COOKIE_NAME = 'payload-token'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(AUTH_COOKIE_NAME)
}
