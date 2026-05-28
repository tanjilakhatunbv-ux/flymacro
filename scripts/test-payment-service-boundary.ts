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

const servicePath = 'src/lib/payment-service.ts'
assert(existsSync(join(process.cwd(), servicePath)), 'Payment service helper must exist.')

const service = read(servicePath)
for (const exportName of [
  'createCheckoutSessionForUser',
  'handlePaymentSuccess',
  'DuplicateWebhookError',
  'InvalidWebhookPayloadError',
]) {
  assert(service.includes(`export `) && service.includes(exportName), `Payment service must export ${exportName}.`)
}

for (const required of [
  'creemFetch',
  'credit-packages',
  'SELECT id FROM credit_orders WHERE creem_checkout_id',
  'UPDATE users SET credits = credits +',
  'credit-orders',
  'credit-transactions',
  'notifications',
  'writeAuditLog',
]) {
  assert(service.includes(required), `Payment service must include ${required}.`)
}

for (const route of [
  'src/app/api/payment/checkout/route.ts',
  'src/app/api/payment/webhook/route.ts',
]) {
  const source = read(route)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${route} must use payment-service instead of importing getPayload directly.`,
  )
  assert(
    !source.includes("from '@payloadcms/db-postgres'"),
    `${route} must not run SQL directly after payment-service extraction.`,
  )
  assert(source.includes('payment-service'), `${route} must import from payment-service.`)
}

console.log('Payment routes use the payment-service boundary.')
