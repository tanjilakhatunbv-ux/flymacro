import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

export default async function ContactPage() {
  const t = await getTranslations('contact')
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/flymacro'
  const wechatQrUrl = process.env.NEXT_PUBLIC_WECHAT_QR_URL || '/images/wechat-qr.png'

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
              {t('imTitle')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', border: '1px solid var(--border-soft)', borderRadius: 3 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Telegram</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {t('telegramDesc')}
                </p>
                <a href={telegramUrl} target="_blank" rel="noopener" className="btn" style={{ fontSize: '0.85rem' }}>
                  {t('telegramButton')}
                </a>
              </div>

              <div style={{ padding: '1rem', border: '1px solid var(--border-soft)', borderRadius: 3 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('wechatTitle')}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {t('wechatDesc')}
                </p>
                <div style={{ width: 120, height: 120, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={wechatQrUrl} alt={t('wechatAlt')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            </div>
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
