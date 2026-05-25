import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getPayload } from '../../../../lib/payload'
import { resolveContactChannels } from '../../../../lib/contact-channels'
import type { SiteSetting } from '../../../../payload-types'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  }
}

export default async function ContactPage() {
  const t = await getTranslations('contact')
  const payload = await getPayload()
  const settingsResult = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
  const contactPage = (settingsResult as SiteSetting | null)?.contactPage
  const channels = resolveContactChannels(contactPage)

  return (
    <div className="container-page page-single">
      <article className="auth-card" style={{ maxWidth: 720 }}>
        <header className="detail-header">
          <h1>{t('pageTitle')}</h1>
          <p className="detail-subtitle">{t('pageSubtitle')}</p>
        </header>

        <div className="auth-body" style={{ gap: '2rem' }}>
          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
              {t('ticketTitle')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              {t('ticketDesc')}
            </p>
            <Link href="/account/tickets/new" className="btn btn-primary">
              {t('ticketButton')}
            </Link>
          </section>

          <div className="user-menu-sep" role="separator" style={{ margin: '0.5rem 0' }} />

          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
              {t('channelsTitle')}
            </h3>
            {channels.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                {channels.map((channel) => (
                  <div key={channel.type} style={{ padding: '1rem', border: '1px solid var(--border-soft)', borderRadius: 3 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{channel.label}</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                      {channel.value}
                    </p>
                    {channel.note && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        {channel.note}
                      </p>
                    )}
                    {channel.href && (
                      <a href={channel.href} target={channel.type === 'email' ? undefined : '_blank'} rel={channel.type === 'email' ? undefined : 'noopener'} className="btn" style={{ fontSize: '0.85rem' }}>
                        {t('channelButton', { channel: channel.label })}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem', border: '1px solid var(--border-soft)', borderRadius: 3, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {t('noChannels')}
              </div>
            )}
          </section>

          <div className="user-menu-sep" role="separator" style={{ margin: '0.5rem 0' }} />

          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
              {t('faqTitle')}
            </h3>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
              <li>{t('faq1')}</li>
              <li>{t('faq2')}</li>
              <li>{t('faq3')}</li>
              <li>{t('faq4')}</li>
            </ul>
          </section>
        </div>
      </article>
    </div>
  )
}
