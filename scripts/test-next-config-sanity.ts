import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const nextConfig = readFileSync(join(process.cwd(), 'next.config.mjs'), 'utf8')
const middleware = readFileSync(join(process.cwd(), 'src/middleware.ts'), 'utf8')

if (/^\s*metadataBase\s*:/m.test(nextConfig)) {
  console.error('next.config.mjs must not define top-level metadataBase; set metadataBase in route metadata instead.')
  process.exit(1)
}

if (/nodeMiddleware\s*:\s*true/.test(nextConfig)) {
  console.error('experimental.nodeMiddleware is canary-only on this Next.js version; middleware must stay Edge-compatible instead.')
  process.exit(1)
}

if (middleware.includes("runtime: 'nodejs'")) {
  console.error('middleware must not use nodejs runtime on stable Next.js; keep it Edge-compatible.')
  process.exit(1)
}

console.log('Next config sanity checks passed.')
