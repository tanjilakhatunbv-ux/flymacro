import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthForm } from '../../../../components/AuthForm'
import { OAuthButtons } from '../../../../components/OAuthButtons'
import { getCurrentUser } from '../../../../lib/auth'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('loginTitle')} — FlyMacro` }
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ return?: string; error?: string; message?: string }>

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  const sp = await searchParams
  const returnUrl = sanitizeReturnUrl(sp.return)
  const oauthError = sp.error === 'oauth' ? sp.message : undefined
  const user = await getCurrentUser()
  if (user) redirect(returnUrl)

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>{t('loginTitle')}</h1>
          <p className="detail-subtitle">{t('loginSubtitle')}</p>
        </header>
        <div className="auth-body">
          {oauthError && (
            <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
              {oauthError}
            </div>
          )}
          <AuthForm mode="login" returnUrl={returnUrl} />
          <OAuthButtons returnUrl={returnUrl} />
          <p className="auth-help">
            {t('adminLink')}
            <Link href="/admin" style={{ marginLeft: 4 }}>
              /admin
            </Link>
            。
          </p>
        </div>
      </article>
    </div>
  )
}

function sanitizeReturnUrl(input?: string): string {
  if (!input) return '/account'
  if (!input.startsWith('/') || input.startsWith('//')) return '/account'
  return input
}
