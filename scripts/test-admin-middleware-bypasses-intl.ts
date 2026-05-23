import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/middleware.ts'), 'utf8')

if (!/if\s*\(\s*pathname\s*===\s*['"]\/admin['"]\s*\|\|\s*pathname\.startsWith\(['"]\/admin\/['"]\)\s*\)\s*return\s+NextResponse\.next\(\)/.test(source)) {
  console.error('Admin middleware must return NextResponse.next() for /admin paths after auth gating so next-intl cannot rewrite Payload admin routes.')
  process.exit(1)
}

if (!source.includes("url.pathname = '/admin/login'")) {
  console.error('Unauthenticated admin requests must still redirect directly to /admin/login.')
  process.exit(1)
}

console.log('Admin middleware bypasses next-intl for Payload admin routes.')
