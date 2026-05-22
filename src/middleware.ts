import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const WINDOWS_1252_BYTES: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c,
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c,
  'ž': 0x9e,
  'Ÿ': 0x9f,
}

function fixMojibakePathname(pathname: string): string | null {
  const segments = pathname.split('/')
  let changed = false

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (!segment.includes('%')) continue

    try {
      const decoded = decodeURIComponent(segment)
      if (!/[À-ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/.test(decoded)) continue

      const repaired = Array.from(decoded, (char) => {
        const byte = WINDOWS_1252_BYTES[char] ?? char.charCodeAt(0)
        if (byte <= 0x7f) return encodeURIComponent(char)
        if (byte <= 0xff) return `%${byte.toString(16).toUpperCase().padStart(2, '0')}`
        return encodeURIComponent(char)
      }).join('')

      if (repaired !== segment) {
        decodeURIComponent(repaired)
        segments[i] = repaired
        changed = true
      }
    } catch {
      // Ignore invalid escapes and non-UTF-8 repair attempts.
    }
  }

  return changed ? segments.join('/') : null
}

function isPublicAdminPath(pathname: string): boolean {
  return (
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login/') ||
    pathname === '/admin/forgot' ||
    pathname.startsWith('/admin/forgot/') ||
    pathname === '/admin/forgot-password' ||
    pathname.startsWith('/admin/forgot-password/') ||
    pathname === '/admin/create-first-user' ||
    pathname.startsWith('/admin/create-first-user/')
  )
}

function redirectUnauthenticatedAdmin(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) return null
  if (isPublicAdminPath(pathname)) return null
  if (request.cookies.has('payload-token')) return null

  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  return NextResponse.redirect(url)
}

export default function middleware(request: NextRequest) {
  const adminRedirect = redirectUnauthenticatedAdmin(request)
  if (adminRedirect) return adminRedirect

  const fixed = fixMojibakePathname(request.nextUrl.pathname)
  if (fixed && fixed !== request.nextUrl.pathname) {
    const url = request.nextUrl.clone()
    url.pathname = fixed
    return NextResponse.rewrite(url)
  }
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/admin/:path*', '/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
