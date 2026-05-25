import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const header = readFileSync(join(process.cwd(), 'src/components/Header.tsx'), 'utf8')
const footer = readFileSync(join(process.cwd(), 'src/components/Footer.tsx'), 'utf8')
const zhMessages = readFileSync(join(process.cwd(), 'src/messages/zh.json'), 'utf8')
const enMessages = readFileSync(join(process.cwd(), 'src/messages/en.json'), 'utf8')
const zh = JSON.parse(zhMessages)
const en = JSON.parse(enMessages)

if (!header.includes("'contact'") || !header.includes("'/contact'")) {
  console.error('Header navigation must expose a /contact link so users can find support from the homepage.')
  process.exit(1)
}

if (!footer.includes('href="/contact"')) {
  console.error('Footer must expose a /contact link as a persistent support entry.')
  process.exit(1)
}

if (zh.nav?.contact !== '\u8054\u7cfb\u65b9\u5f0f' || en.nav?.contact !== 'Contact') {
  console.error('Navigation messages must include localized contact labels.')
  process.exit(1)
}

console.log('Contact page is linked from the header and footer.')
