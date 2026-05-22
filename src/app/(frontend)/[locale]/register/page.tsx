import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthForm } from '../../../../components/AuthForm'
import { OAuthButtons } from '../../../../components/OAuthButtons'
import { getCurrentUser } from '../../../../lib/auth'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('registerTitle')} — FlyMacro` }
}

export const revalidate = 300

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  const user = await getCurrentUser()
  if (user) redirect('/account')

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>{t('registerTitle')}</h1>
          <p className="detail-subtitle">{t('registerSubtitle')}</p>
        </header>
        <div className="auth-body">
          <AuthForm mode="register" turnstileSiteKey={turnstileSiteKey || undefined} />
          <OAuthButtons />
          <p className="auth-help">
            {t('termsAgree')}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/about" style={{ margin: '0 4px' }}>
              {t('termsLink')}
            </a>
            {t('termsAfter')}
          </p>
        </div>
      </article>
    </div>
  )
}
