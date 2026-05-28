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

const helperPath = 'src/lib/account-data.ts'
assert(existsSync(join(process.cwd(), helperPath)), 'Account data helper must exist at src/lib/account-data.ts.')

const helper = read(helperPath)
for (const exportName of [
  'getAccountSummary',
  'getAccountCreditOrders',
  'getAccountCreditTransactions',
  'getAccountNotifications',
  'getAccountMacroExchanges',
]) {
  assert(
    helper.includes(`export async function ${exportName}`),
    `Account data helper must export ${exportName}.`,
  )
}

for (const page of [
  'src/app/(frontend)/[locale]/account/page.tsx',
  'src/app/(frontend)/[locale]/account/orders/page.tsx',
  'src/app/(frontend)/[locale]/account/transactions/page.tsx',
  'src/app/(frontend)/[locale]/account/notifications/page.tsx',
  'src/app/(frontend)/[locale]/account/exchanges/page.tsx',
]) {
  const source = read(page)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${page} must read account data through src/lib/account-data.ts instead of importing getPayload directly.`,
  )
  assert(
    source.includes('account-data'),
    `${page} must import its account read model from account-data.`,
  )
}

console.log('Account read pages use the account-data boundary.')
