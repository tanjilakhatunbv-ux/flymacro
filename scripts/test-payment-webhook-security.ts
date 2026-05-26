import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const webhook = readFileSync(join(root, 'src/app/api/payment/webhook/route.ts'), 'utf8')
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>
}
const canary = readFileSync(join(root, 'scripts/security-canary-prod.mjs'), 'utf8')

const requiredWebhookChecks = [
  'verifyCreemSignature',
  'timingSafeEqual',
  'DuplicateWebhookError',
  'InvalidWebhookPayloadError',
  'missing-checkout-fields',
  'product-mismatch',
  'currency-mismatch',
  'amount-mismatch',
  'package-not-found',
  'user-not-found',
  'SELECT id FROM credit_orders WHERE creem_checkout_id',
  'UPDATE users SET credits = credits +',
]

for (const required of requiredWebhookChecks) {
  if (!webhook.includes(required)) {
    console.error(`Payment webhook must include security guard: ${required}.`)
    process.exit(1)
  }
}

if (packageJson.scripts?.['security:prod'] !== 'node scripts/security-canary-prod.mjs') {
  console.error('package.json must expose security:prod for production security canary checks.')
  process.exit(1)
}

for (const required of [
  'unauthenticated user create is forbidden',
  '/api/credit-orders',
  '/api/credit-transactions',
  '/api/redeem-codes',
  '/api/macro-exchanges',
  'OAuth returnUrl is sanitized',
  'prod-security-canary-latest.json',
]) {
  if (!canary.includes(required)) {
    console.error(`Production security canary must include probe: ${required}.`)
    process.exit(1)
  }
}

console.log('Payment webhook and production security canary guards passed.')
