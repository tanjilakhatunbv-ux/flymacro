import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'scripts/qa-critical.ts'), 'utf8')

if (!/allowRedirects\?\s*:\s*boolean/.test(source)) {
  console.error('Critical QA routes must be able to opt into following user-facing redirects.')
  process.exit(1)
}

if (!/redirect:\s*allowRedirects\s*\?\s*'follow'\s*:\s*'manual'/.test(source)) {
  console.error('Critical QA must follow redirects only for routes that intentionally redirect.')
  process.exit(1)
}

for (const route of ['/login', '/register']) {
  const pattern = new RegExp(`path:\\s*'${route}'[\\s\\S]*?allowRedirects:\\s*true`)
  if (!pattern.test(source)) {
    console.error(`Critical QA must follow the legacy ${route} redirect to the unified auth page.`)
    process.exit(1)
  }
}

console.log('Critical QA follows intentional legacy auth redirects.')
