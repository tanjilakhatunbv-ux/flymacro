import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const rules = readFileSync(join(root, 'src/lib/redeem-code-rules.ts'), 'utf8')
const collection = readFileSync(join(root, 'src/collections/RedeemCodes.ts'), 'utf8')

const expected = [
  [10, 'F010'],
  [20, 'F020'],
  [50, 'F050'],
  [100, 'F100'],
  [200, 'F200'],
  [500, 'F500'],
] as const

for (const [credits, prefix] of expected) {
  if (!rules.includes(`${credits}: '${prefix}'`)) {
    console.error(`Redeem code rules must map ${credits} credits to ${prefix}.`)
    process.exit(1)
  }
}

for (const forbidden of ['F030', 'F300', '1000']) {
  if (rules.includes(forbidden)) {
    console.error(`Redeem code rules must not include unsupported package marker ${forbidden}.`)
    process.exit(1)
  }
}

for (const requiredSymbol of [
  'REDEEM_CODE_CREDIT_OPTIONS',
  'getRedeemCodePrefix',
  'getRedeemCodeCreditsFromCode',
  'assertRedeemCodeMatchesCredits',
  'generateRedeemCode',
]) {
  if (!rules.includes(requiredSymbol)) {
    console.error(`Redeem code rules must export ${requiredSymbol}.`)
    process.exit(1)
  }
}

if (!collection.includes('assertRedeemCodeMatchesCredits')) {
  console.error('RedeemCodes collection must validate that code prefix matches creditsGranted.')
  process.exit(1)
}

if (!collection.includes('redeemedCount') || !collection.includes('maxRedemptions')) {
  console.error('RedeemCodes collection must track redeemedCount and maxRedemptions.')
  process.exit(1)
}

console.log('Redeem code rules and collection validation are wired.')
