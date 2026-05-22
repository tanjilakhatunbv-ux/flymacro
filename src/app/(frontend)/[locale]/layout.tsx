import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header } from '../../../components/Header'
import { Footer } from '../../../components/Footer'
import { DynamicVerificationBanner } from '../../../components/DynamicVerificationBanner'
import '../../../styles/globals.css'

type Params = Promise<{ locale: string }>

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const baseUrl = 'https://flymacro.qzz.io'
  const alternateLocale = locale === 'zh' ? 'en' : 'zh'

  return {
    title: t('title'),
    description: t('description'),
    icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        zh: `${baseUrl}/zh`,
        en: `${baseUrl}/en`,
        'x-default': `${baseUrl}/zh`,
      },
    },
  }
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'zh' | 'en')) {
    notFound()
  }

  const allMessages = await getMessages()
  const publicNamespaces = [
    'nav', 'account', 'auth', 'apiErrors', 'wow', 'tier',
    'home', 'macros', 'macroCard', 'macroDetail', 'macroFilters',
    'macroGrid', 'codeBlock', 'pagination', 'video',
    'news', 'scripts', 'guide', 'blog', 'about', 'plugins',
    'credits', 'creditPackages', 'contact', 'error', 'metadata', 'oauth',
  ]
  const messages = Object.fromEntries(
    publicNamespaces.filter((k) => k in allMessages).map((k) => [k, allMessages[k as keyof typeof allMessages]]),
  )

  return (
    <html lang={locale === 'zh' ? 'zh-CN' : locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <DynamicVerificationBanner />
          <Header />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
