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

const helperPath = 'src/lib/macro-exchange-service.ts'
assert(existsSync(join(process.cwd(), helperPath)), 'Macro exchange service helper must exist.')

const helper = read(helperPath)
for (const exportName of [
  'exchangeMacroForUser',
  'renewMacroExchangeForUser',
  'processDueMacroAutoRenewals',
]) {
  assert(
    helper.includes(`export async function ${exportName}`),
    `Macro exchange service must export ${exportName}.`,
  )
}

for (const required of [
  'UPDATE users SET credits = credits -',
  'macro-exchanges',
  'credit-transactions',
  'notifications',
  'writeAuditLog',
]) {
  assert(helper.includes(required), `Macro exchange service must include ${required}.`)
}

for (const route of [
  'src/app/api/macro/exchange/route.ts',
  'src/app/api/macro/renew/route.ts',
  'src/app/api/cron/auto-renew/route.ts',
]) {
  const source = read(route)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${route} must use macro-exchange-service instead of importing getPayload directly.`,
  )
  assert(
    !source.includes("from '@payloadcms/db-postgres'"),
    `${route} must not run SQL directly after macro-exchange-service extraction.`,
  )
  assert(
    source.includes('macro-exchange-service'),
    `${route} must import from macro-exchange-service.`,
  )
}

console.log('Macro exchange write routes use the macro-exchange-service boundary.')
