import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const redeemRoute = readFileSync(join(root, 'src/app/api/redeem-code/route.ts'), 'utf8')
const redeemService = readFileSync(join(root, 'src/lib/redeem-code-service.ts'), 'utf8')
const adminGenerateRoute = readFileSync(join(root, 'src/app/api/admin/redeem-codes/generate/route.ts'), 'utf8')
const adminPlainRoute = readFileSync(join(root, 'src/app/api/admin/redeem-codes/plain/route.ts'), 'utf8')

for (const required of [
  'getCurrentUser',
  'normalizeRedeemCode',
  'redeemCodeForUser',
  'writeAuditLog',
  'redeem_code_not_found',
  'redeem_code_disabled',
  'redeem_code_exhausted',
]) {
  if (!redeemRoute.includes(required)) {
    console.error(`Redeem route must include ${required}.`)
    process.exit(1)
  }
}

for (const required of [
  'assertRedeemCodeMatchesCredits',
  'FOR UPDATE',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'redeem_code',
  'redeem-code-redemptions',
  'credit-transactions',
  'redeemed_count = redeemed_count + 1',
]) {
  if (!redeemService.includes(required)) {
    console.error(`Redeem service must include ${required}.`)
    process.exit(1)
  }
}

for (const required of [
  'requireAdmin',
  'generateRedeemCode',
  'REDEEM_CODE_CREDIT_OPTIONS',
  'maxRedemptions',
  'redeem-codes',
]) {
  if (!adminGenerateRoute.includes(required)) {
    console.error(`Admin generate route must include ${required}.`)
    process.exit(1)
  }
}

for (const required of ['requireAdmin', 'code', 'redeem-codes']) {
  if (!adminPlainRoute.includes(required)) {
    console.error(`Admin plain-code route must include ${required}.`)
    process.exit(1)
  }
}

console.log('Redeem code API routes include required transaction and admin behavior.')
