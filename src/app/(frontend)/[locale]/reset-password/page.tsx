import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AuthForm } from '../../../../components/AuthForm'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('resetTitle')} — FlyMacro` }
}

type SearchParams = Promise<{ token?: string }>

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  const tVerify = await getTranslations({ locale, namespace: 'verify' })
  const sp = await searchParams
  const token = sp.token ?? ''

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>{t('resetTitle')}</h1>
        </header>
        <div className="auth-body">
          {token ? (
            <AuthForm mode="reset" resetToken={token} />
          ) : (
            <p className="auth-help">
              {tVerify('expiredLink')}
              <Link href="/forgot-password" style={{ marginLeft: 4 }}>
                {t('forgotTitle')}
              </Link>
            </p>
          )}
        </div>
      </article>
    </div>
  )
}
