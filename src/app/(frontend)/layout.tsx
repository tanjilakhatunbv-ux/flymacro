import type { Metadata } from 'next'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { cinzel, cinzelDecorative, marcellusSC, imFellEnglishSC, jetbrainsMono } from '../../lib/fonts'
import '../../styles/globals.css'

export const metadata: Metadata = {
  title: 'FlyMacro — 魔兽世界宏命令库',
  description: '高质量的魔兽世界宏命令分享与下载，覆盖全部职业专精。免费基础宏 + 付费实战宏。',
  icons: { icon: '/favicon.ico' },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    cinzel.variable,
    cinzelDecorative.variable,
    marcellusSC.variable,
    imFellEnglishSC.variable,
    jetbrainsMono.variable,
  ].join(' ')

  return (
    <html lang="zh-CN" className={fontVars}>
      <head>
        {/* CJK fonts loaded via CDN; Latin fonts self-hosted via next/font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
