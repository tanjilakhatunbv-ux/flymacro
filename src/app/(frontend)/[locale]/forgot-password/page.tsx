import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthForm } from '../../../../components/AuthForm'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('forgotTitle')} — FlyMacro` }
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>{t('forgotTitle')}</h1>
          <p className="detail-subtitle">{t('forgotSubtitle')}</p>
        </header>
        <div className="auth-body">
          <AuthForm mode="forgot" />
        </div>
      </article>
    </div>
  )
}
