import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(message)
    process.exit(1)
  }
}

const dataPath = 'src/lib/redeem-code-data.ts'
assert(existsSync(join(process.cwd(), dataPath)), 'Redeem code data helper must exist.')

const data = read(dataPath)
assert(
  data.includes('export async function getAccountRedeemCodeRedemptions'),
  'Redeem code data helper must export getAccountRedeemCodeRedemptions.',
)

const servicePath = 'src/lib/redeem-code-service.ts'
assert(existsSync(join(process.cwd(), servicePath)), 'Redeem code service helper must exist.')

const service = read(servicePath)
for (const required of [
  'export async function redeemCodeForUser',
  'normalizeRedeemCode',
  'assertRedeemCodeMatchesCredits',
  'FOR UPDATE',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'redeem-code-redemptions',
  'credit-transactions',
  'redeemed_count = redeemed_count + 1',
]) {
  assert(service.includes(required), `Redeem code service must include ${required}.`)
}

for (const sourcePath of [
  'src/app/(frontend)/[locale]/account/redeem/page.tsx',
  'src/app/api/redeem-code/route.ts',
]) {
  const source = read(sourcePath)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${sourcePath} must use redeem code helpers instead of importing getPayload directly.`,
  )
}

const page = read('src/app/(frontend)/[locale]/account/redeem/page.tsx')
assert(
  page.includes('redeem-code-data'),
  'Account redeem page must import redemptions through redeem-code-data.',
)

const route = read('src/app/api/redeem-code/route.ts')
assert(
  route.includes('redeem-code-service'),
  'Redeem code API route must import redemption behavior through redeem-code-service.',
)

console.log('Redeem code page and API use data/service boundaries.')
