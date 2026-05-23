import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const header = readFileSync(join(process.cwd(), 'src/components/Header.tsx'), 'utf8')
const headerAuth = readFileSync(join(process.cwd(), 'src/components/HeaderAuth.tsx'), 'utf8')

if (!header.includes('prefetch={false} className="site-logo"')) {
  console.error('Header logo link must disable prefetch to avoid extra homepage RSC requests.')
  process.exit(1)
}

if (!/href=\{navHrefs\[i\]\}\s+prefetch=\{false\}/.test(header)) {
  console.error('Header nav links must disable prefetch to avoid eager RSC requests for every top-level page.')
  process.exit(1)
}

if (!/href="\/auth\?mode=login"\s+prefetch=\{false\}/.test(headerAuth)) {
  console.error('Header auth link must disable prefetch to keep logged-out page loads lean.')
  process.exit(1)
}

if ((headerAuth.match(/href="\/auth\?mode=/g) ?? []).length !== 1) {
  console.error('Header must expose one unified auth entry instead of separate login/register links.')
  process.exit(1)
}

console.log('Header navigation disables eager route prefetching.')
