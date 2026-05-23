import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { VerifyEmailRunner } from '../../../../components/VerifyEmailRunner'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('verifyTitle')} — FlyMacro` }
}

type SearchParams = Promise<{ token?: string }>

export default async function VerifyEmailPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  const tVerify = await getTranslations({ locale, namespace: 'verify' })
  const sp = await searchParams
  const token = sp.token ?? ''

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>{t('verifyTitle')}</h1>
        </header>
        <div className="auth-body">
          {token ? (
            <VerifyEmailRunner token={token} />
          ) : (
            <p className="auth-help">
              {tVerify('invalidLink')}
              <Link href="/auth?mode=login" style={{ marginLeft: 4 }}>
                {tVerify('backToLogin')}
              </Link>
              。
            </p>
          )}
        </div>
      </article>
    </div>
  )
}
