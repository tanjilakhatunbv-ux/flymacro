import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const sections = [
    {
      title: t('addonTitle'),
      body: t('addonBody'),
    },
    {
      title: t('guidesTitle'),
      body: t('guidesBody'),
    },
    {
      title: t('scriptsTitle'),
      body: t('scriptsBody'),
    },
  ]

  return (
    <div className="container-page page-single">
      <article className="macro-detail">
        <header className="detail-header">
          <h1>{t('pageTitle')}</h1>
        </header>
        <div className="detail-content">
          <p>{t('intro')}</p>

          <h2>{t('whatWeDoTitle')}</h2>
          {sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}

          <h2>{t('creditsTitle')}</h2>
          <p>{t('creditsBody')}</p>

          <h2>{t('supportTitle')}</h2>
          <p>
            {t('supportBody')}{' '}
            <a href="mailto:support@flymacro.qzz.io">support@flymacro.qzz.io</a>
          </p>
        </div>
      </article>
    </div>
  )
}
