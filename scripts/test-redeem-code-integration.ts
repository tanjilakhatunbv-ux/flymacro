import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const payloadConfig = readFileSync(join(root, 'src/payload.config.ts'), 'utf8')
const users = readFileSync(join(root, 'src/collections/Users.ts'), 'utf8')
const transactions = readFileSync(join(root, 'src/collections/CreditTransactions.ts'), 'utf8')
const transactionPage = readFileSync(join(root, 'src/app/(frontend)/[locale]/account/transactions/page.tsx'), 'utf8')
const accountNav = readFileSync(join(root, 'src/components/AccountSideNav.tsx'), 'utf8')
const creditPurchaseContent = readFileSync(join(root, 'src/components/CreditPurchaseContent.tsx'), 'utf8')
const zh = JSON.parse(readFileSync(join(root, 'src/messages/zh.json'), 'utf8')) as Record<string, any>
const en = JSON.parse(readFileSync(join(root, 'src/messages/en.json'), 'utf8')) as Record<string, any>

for (const symbol of ['RedeemCodes', 'RedeemCodeRedemptions']) {
  if (!payloadConfig.includes(symbol)) {
    console.error(`payload.config.ts must register ${symbol}.`)
    process.exit(1)
  }
}

if (!users.includes('redeemCodeRedemptionsJoin')) {
  console.error('Users collection must expose a bounded redeemCodeRedemptionsJoin for admin lookup.')
  process.exit(1)
}

if (!transactions.includes("value: 'redeem_code'")) {
  console.error('CreditTransactions must include redeem_code type.')
  process.exit(1)
}

if (!transactionPage.includes('typeRedeemCode')) {
  console.error('Account transactions page must label redeem_code transactions.')
  process.exit(1)
}

if (!accountNav.includes('/account/redeem') || !accountNav.includes("labelKey: 'redeemCodes'")) {
  console.error('Account side nav must include the redeem code page.')
  process.exit(1)
}

if (!creditPurchaseContent.includes('RedeemCodeForm')) {
  console.error('Credits page must show the redeem code form above credit packages.')
  process.exit(1)
}

for (const locale of [zh, en]) {
  if (!locale.redeemCode?.heading || !locale.redeemCode?.historyTitle || !locale.sideNav?.redeemCodes) {
    console.error('Both zh and en messages must include redeemCode page/form keys and sideNav.redeemCodes.')
    process.exit(1)
  }
  if (!locale.apiErrors?.redeem_code_not_found || !locale.apiErrors?.redeem_code_exhausted) {
    console.error('Both zh and en messages must include redeem code API error translations.')
    process.exit(1)
  }
  if (!locale.transactions?.typeRedeemCode) {
    console.error('Both zh and en transaction messages must include typeRedeemCode.')
    process.exit(1)
  }
}

console.log('Redeem code frontend, messages, and collection registrations are wired.')
