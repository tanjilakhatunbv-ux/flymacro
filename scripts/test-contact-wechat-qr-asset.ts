import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const contactPage = readFileSync(join(process.cwd(), 'src/app/(frontend)/[locale]/contact/page.tsx'), 'utf8')
const settings = readFileSync(join(process.cwd(), 'src/globals/SiteSettings.ts'), 'utf8')

if (!contactPage.includes('resolveContactChannels(contactPage)')) {
  console.error('Contact page must resolve channels from site-settings contactPage config.')
  process.exit(1)
}

for (const channel of ['email', 'telegram', 'discord', 'qq']) {
  if (!settings.includes(`name: '${channel}'`)) {
    console.error(`Site settings must expose a ${channel} contact channel group.`)
    process.exit(1)
  }
}

if (!settings.includes("name: 'contactPage'") || !settings.includes("label: '联系方式页面设置'")) {
  console.error('Site settings must expose contactPage controls in the admin.')
  process.exit(1)
}

if (contactPage.includes('NEXT_PUBLIC_WECHAT_QR_URL')) {
  console.error('Contact page should use the configured Email, Telegram, Discord, and QQ channels instead of the legacy WeChat QR env.')
  process.exit(1)
}

console.log('Contact page uses configurable Email, Telegram, Discord, and QQ channels.')
