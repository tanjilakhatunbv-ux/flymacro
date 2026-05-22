import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'next.config.mjs'), 'utf8')

if (!source.includes('const devScriptSrc')) {
  console.error('next.config.mjs should define a devScriptSrc CSP helper so Next dev hydration can run safely in development.')
  process.exit(1)
}

if (!source.includes("script-src 'self' 'unsafe-inline'${devScriptSrc}")) {
  console.error('frontend CSP script-src must include the development-only unsafe-eval helper.')
  process.exit(1)
}

console.log('Frontend CSP allows Next dev hydration only in development.')
