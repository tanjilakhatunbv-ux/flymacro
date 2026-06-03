import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const canary = readFileSync(join(root, 'scripts/canary-prod.mjs'), 'utf8')
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>
}

if (packageJson.scripts?.['canary:prod'] !== 'node scripts/canary-prod.mjs') {
  console.error('package.json must expose canary:prod for production health checks.')
  process.exit(1)
}

for (const path of ['/', '/macros', '/credits', '/scripts', '/guide', '/news', '/auth?mode=login', '/admin/login']) {
  if (!canary.includes(`path: '${path}'`)) {
    console.error(`Production canary must cover critical route: ${path}`)
    process.exit(1)
  }
}

for (const required of [
  'Runtime.exceptionThrown',
  'Runtime.consoleAPICalled',
  '.skeleton-pulse',
  'Application error',
  'remote-debugging-port',
  'findChrome',
  'prod-canary-latest.json',
]) {
  if (!canary.includes(required)) {
    console.error(`Production canary must include guard: ${required}`)
    process.exit(1)
  }
}

console.log('Production canary coverage checks passed.')
