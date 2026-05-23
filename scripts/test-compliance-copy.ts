import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const zh = JSON.parse(readFileSync(join(root, 'src/messages/zh.json'), 'utf8')) as Record<string, any>
const en = JSON.parse(readFileSync(join(root, 'src/messages/en.json'), 'utf8')) as Record<string, any>
const aboutPage = readFileSync(join(root, 'src/app/(frontend)/[locale]/about/page.tsx'), 'utf8')
const creditsPage = readFileSync(join(root, 'src/app/(frontend)/[locale]/credits/page.tsx'), 'utf8')
const creditPackages = readFileSync(join(root, 'src/components/CreditPackages.tsx'), 'utf8')

const requiredAboutKeys = [
  'intro',
  'whatWeDoTitle',
  'addonTitle',
  'addonBody',
  'guidesTitle',
  'guidesBody',
  'scriptsTitle',
  'scriptsBody',
  'creditsTitle',
  'creditsBody',
  'supportTitle',
  'supportBody',
]

for (const locale of [zh, en]) {
  for (const key of requiredAboutKeys) {
    if (!locale.about?.[key]) {
      console.error(`about.${key} is required in both zh and en messages.`)
      process.exit(1)
    }
  }
}

if (aboutPage.includes('locale ===') || aboutPage.includes('AboutZh') || aboutPage.includes('AboutEn')) {
  console.error('About page should render from localized messages instead of hard-coded locale branches.')
  process.exit(1)
}

const zhNotice = Object.entries(zh.credits)
  .filter(([key]) => /^notice\d+$/.test(key))
  .map(([, value]) => String(value))
  .join('\n')
const enNotice = Object.entries(en.credits)
  .filter(([key]) => /^notice\d+$/.test(key))
  .map(([, value]) => String(value))
  .join('\n')

if (!zhNotice.includes('购买成功后不支持退款')) {
  console.error('Chinese purchase notice must clearly say successful purchases are non-refundable.')
  process.exit(1)
}

if (!enNotice.includes('non-refundable')) {
  console.error('English purchase notice must clearly say successful purchases are non-refundable.')
  process.exit(1)
}

for (const forbidden of ['常规宏兑换后永久有效', '默认有效期 30 天', '支持自动续费', 'premium macro setups']) {
  if (zhNotice.includes(forbidden) || enNotice.includes(forbidden)) {
    console.error(`Purchase notice must not contain outdated copy: ${forbidden}`)
    process.exit(1)
  }
}

if (!zhNotice.includes('点券仅用于兑换宏脚本')) {
  console.error('Chinese purchase notice must say Credits are only used to redeem macro scripts.')
  process.exit(1)
}

if (!enNotice.includes('redeem macro scripts')) {
  console.error('English purchase notice must say Credits are only used to redeem macro scripts.')
  process.exit(1)
}

if (!creditsPage.includes("locale === 'zh'") || !creditsPage.includes('hasCreditBalanceLabel')) {
  console.error('Credits page must avoid applying Chinese CMS copy to every locale and must use stable balance-label detection.')
  process.exit(1)
}

if (creditPackages.includes('<h4>{pkg.label}</h4>')) {
  console.error('Credit package cards must render localized pack labels instead of raw database labels.')
  process.exit(1)
}

if (!creditPackages.includes("t('packLabel'") || !creditPackages.includes('discountLabel(pkg.discountLabel')) {
  console.error('Credit package cards must localize package names and common discount labels.')
  process.exit(1)
}

console.log('Compliance copy and credits page display checks passed.')
