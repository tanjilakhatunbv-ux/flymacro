import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const creditPackages = readFileSync(join(root, 'src/components/CreditPackages.tsx'), 'utf8')
const zh = JSON.parse(readFileSync(join(root, 'src/messages/zh.json'), 'utf8')) as Record<string, any>
const en = JSON.parse(readFileSync(join(root, 'src/messages/en.json'), 'utf8')) as Record<string, any>

if (creditPackages.includes("t('bonusCredits'") || creditPackages.includes('credit-bonus')) {
  console.error('Credit package cards must not render bonus-credit copy.')
  process.exit(1)
}

if (/creditsGranted\s*>\s*\(pkg\.amount/.test(creditPackages)) {
  console.error('Credit package cards must not compare granted credits with price to infer bonuses.')
  process.exit(1)
}

if (!creditPackages.includes("t('packLabel'") || !creditPackages.includes('amount: pkg.creditsGranted')) {
  console.error('Credit package card titles must use localized labels based on creditsGranted.')
  process.exit(1)
}

if (!creditPackages.includes('original > (pkg.amount ?? 0)')) {
  console.error('Original price must only display when originalAmount is greater than amount.')
  process.exit(1)
}

if ('bonusCredits' in (zh.creditPackages ?? {}) || 'bonusCredits' in (en.creditPackages ?? {})) {
  console.error('Localized credit package messages must not expose bonusCredits.')
  process.exit(1)
}

console.log('Credit package discount-pricing display checks passed.')
