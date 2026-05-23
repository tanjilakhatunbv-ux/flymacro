import NextLink from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { AuthForm } from '../../../../components/AuthForm'
import { OAuthButtons } from '../../../../components/OAuthButtons'
import { getCurrentUser } from '../../../../lib/auth'

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

type AuthMode = 'login' | 'register'
type SearchParams = Promise<{ mode?: string; return?: string; error?: string; message?: string }>

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('authTitle')} - FlyMacro` }
}

export const revalidate = 300

export default async function AuthPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  const sp = await searchParams
  const mode = sp.mode === 'register' ? 'register' : 'login'
  const returnUrl = sanitizeReturnUrl(sp.return)
  const oauthError = sp.error === 'oauth' ? sp.message : undefined
  const user = await getCurrentUser()
  if (user) redirect(returnUrl)

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>{mode === 'register' ? t('registerTitle') : t('loginTitle')}</h1>
          <p className="detail-subtitle">{mode === 'register' ? t('registerSubtitle') : t('loginSubtitle')}</p>
        </header>
        <div className="auth-body">
          <AuthModeTabs mode={mode} returnUrl={returnUrl} loginLabel={t('loginTab')} registerLabel={t('registerTab')} />
          {oauthError && (
            <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
              {oauthError}
            </div>
          )}
          <AuthForm mode={mode} returnUrl={returnUrl} turnstileSiteKey={turnstileSiteKey} />
          <OAuthButtons returnUrl={returnUrl} />
          {mode === 'login' ? (
            <p className="auth-help">
              {t('adminLink')}
              <NextLink href="/admin" style={{ marginLeft: 4 }}>
                /admin
              </NextLink>
              .
            </p>
          ) : (
            <p className="auth-help">
              {t('termsAgree')}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/about" style={{ margin: '0 4px' }}>
                {t('termsLink')}
              </a>
              {t('termsAfter')}
            </p>
          )}
        </div>
      </article>
    </div>
  )
}

function AuthModeTabs({
  mode,
  returnUrl,
  loginLabel,
  registerLabel,
}: {
  mode: AuthMode
  returnUrl: string
  loginLabel: string
  registerLabel: string
}) {
  const loginHref = authHref('login', returnUrl)
  const registerHref = authHref('register', returnUrl)

  return (
    <nav className="auth-mode-tabs" aria-label="Authentication mode">
      <Link href={loginHref} className={mode === 'login' ? 'is-active' : undefined} aria-current={mode === 'login' ? 'page' : undefined}>
        {loginLabel}
      </Link>
      <Link href={registerHref} className={mode === 'register' ? 'is-active' : undefined} aria-current={mode === 'register' ? 'page' : undefined}>
        {registerLabel}
      </Link>
    </nav>
  )
}

function authHref(mode: AuthMode, returnUrl: string): string {
  const params = new URLSearchParams({ mode })
  if (returnUrl !== '/account') params.set('return', returnUrl)
  return `/auth?${params.toString()}`
}

function sanitizeReturnUrl(input?: string): string {
  if (!input) return '/account'
  if (!input.startsWith('/') || input.startsWith('//')) return '/account'
  return input
}
