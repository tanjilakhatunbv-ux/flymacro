import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/middleware.ts'), 'utf8')

const checks = [
  {
    ok: source.includes("matcher: ['/admin/:path*'"),
    message: 'Middleware must include /admin/:path* so unauthenticated admin requests can redirect before the Payload app loads.',
  },
  {
    ok: source.includes("request.cookies.has('payload-token')"),
    message: 'Admin middleware must preserve Payload-authenticated requests by checking the payload-token cookie.',
  },
  {
    ok: source.includes("url.pathname = '/admin/login'"),
    message: 'Unauthenticated admin requests must redirect directly to /admin/login.',
  },
  {
    ok: source.includes("pathname === '/admin/login'") && source.includes("pathname === '/admin/forgot"),
    message: 'Admin middleware must allow public Payload admin login and recovery routes.',
  },
]

for (const check of checks) {
  if (!check.ok) {
    console.error(check.message)
    process.exit(1)
  }
}

console.log('Admin middleware redirects unauthenticated users before loading Payload admin.')
