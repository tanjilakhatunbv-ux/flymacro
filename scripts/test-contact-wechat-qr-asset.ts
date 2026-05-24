import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const contactPage = readFileSync(join(process.cwd(), 'src/app/(frontend)/[locale]/contact/page.tsx'), 'utf8')
const defaultQrMatch = contactPage.match(/NEXT_PUBLIC_WECHAT_QR_URL\s*\|\|\s*'(?<path>\/images\/[^']+)'/)
const defaultQrPath = defaultQrMatch?.groups?.path

if (!defaultQrPath) {
  console.error('Contact page must define a relative default WeChat QR image path.')
  process.exit(1)
}

const publicPath = join(process.cwd(), 'public', defaultQrPath.replace(/^\//, ''))

if (!existsSync(publicPath)) {
  console.error(`Default WeChat QR image is missing at ${defaultQrPath}.`)
  process.exit(1)
}

if (!contactPage.includes("process.env.NEXT_PUBLIC_WECHAT_QR_URL === '/images/wechat-qr.png'")) {
  console.error('Contact page must map the legacy /images/wechat-qr.png env override to the bundled QR asset.')
  process.exit(1)
}

console.log('Contact page default and legacy WeChat QR assets resolve.')
