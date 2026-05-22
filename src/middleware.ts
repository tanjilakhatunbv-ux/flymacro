import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

/**
 * Detects GBK-encoded pathname segments and converts them to UTF-8.
 * Lazy-loads iconv-lite only when percent-encoded segments are found.
 * Returns null if no conversion is needed.
 */
async function fixGbkPathname(pathname: string): Promise<string | null> {
  const segments = pathname.split('/')
  let changed = false
  let iconv: typeof import('iconv-lite') | null = null

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (!segment.includes('%')) continue

    // Lazy-load iconv-lite only when needed
    if (!iconv) {
      iconv = await import('iconv-lite')
    }

    try {
      const utf8 = decodeURIComponent(segment)
      if (/[一-龥　-〿＀-￯]/.test(utf8)) continue
      if (!utf8.includes('�')) continue
    } catch {
      // Not valid UTF-8 — will try GBK below
    }

    try {
      const bytes: number[] = []
      let j = 0
      while (j < segment.length) {
        if (segment[j] === '%' && j + 2 < segment.length) {
          bytes.push(parseInt(segment.slice(j + 1, j + 3), 16))
          j += 3
        } else {
          bytes.push(segment.charCodeAt(j))
          j++
        }
      }
      const buf = Buffer.from(bytes)
      const gbk = iconv.decode(buf, 'gbk')
      if (iconv.encode(gbk, 'gbk').equals(buf)) {
        segments[i] = encodeURIComponent(gbk)
        changed = true
      }
    } catch {
      // Ignore decode errors
    }
  }

  return changed ? segments.join('/') : null
}

export default async function middleware(request: NextRequest) {
  const fixed = await fixGbkPathname(request.nextUrl.pathname)
  if (fixed && fixed !== request.nextUrl.pathname) {
    const url = request.nextUrl.clone()
    url.pathname = fixed
    return NextResponse.rewrite(url)
  }
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
  runtime: 'nodejs',
}
