import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const accountCreditsPage = readFileSync(
  join(root, 'src/app/(frontend)/[locale]/account/credits/page.tsx'),
  'utf8',
)

if (/redirect\s*\(\s*['"]\/credits['"]\s*\)/.test(accountCreditsPage)) {
  console.error('Account credits page must not redirect to /credits because that drops the account side nav.')
  process.exit(1)
}

if (!accountCreditsPage.includes('CreditPurchaseContent') || !accountCreditsPage.includes('shell="account"')) {
  console.error('Account credits page must render the shared credit purchase content inside the account layout.')
  process.exit(1)
}

console.log('Account credits page keeps the account side nav.')
