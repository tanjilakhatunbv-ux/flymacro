import type { Metadata } from 'next'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import '../../styles/globals.css'

export const metadata: Metadata = {
  title: 'FlyMacro — 魔兽世界宏命令库',
  description: '高质量的魔兽世界宏命令分享与下载，覆盖全部职业专精。免费基础宏 + 付费实战宏。',
  icons: { icon: '/favicon.ico' },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
