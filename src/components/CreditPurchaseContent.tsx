import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '../lib/auth'
import { getPayload } from '../lib/payload'
import { CreditPackages } from './CreditPackages'
import { RichText } from './RichText'
import type { CreditPackage, SiteSetting } from '../payload-types'

type CreditPurchaseContentProps = {
  locale: string
  paidStatus?: string
  shell?: 'public' | 'account'
}

export async function CreditPurchaseContent({
  locale,
  paidStatus,
}: CreditPurchaseContentProps) {
  const t = await getTranslations({ locale, namespace: 'credits' })
  const user = await getCurrentUser()

  const payload = await getPayload()

  const pkgResult = await payload.find({
    collection: 'credit-packages',
    where: { enabled: { equals: true } },
    sort: 'sort',
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  const settingsResult = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })

  const packages = pkgResult.docs as CreditPackage[]
  const creditPage = (settingsResult as SiteSetting | null)?.creditPage ?? {}
  const useCustomCreditCopy = locale === 'zh'

  const pageTitle = useCustomCreditCopy && creditPage.title ? creditPage.title : t('pageTitle')
  const pageSubtitle = useCustomCreditCopy && creditPage.subtitle ? creditPage.subtitle : (user
    ? t('subtitleLoggedIn', { credits: (user.credits as number) ?? 0 })
    : t('subtitleGuest'))
  const promoEnabled = creditPage.promoEnabled === true
  const promoBanner = creditPage.promoBanner || ''
  const noticeEnabled = creditPage.noticeEnabled !== false
  const customNotice = useCustomCreditCopy ? creditPage.notice : null

  return (
    <>
      <h1>{pageTitle}</h1>
      <p className="lead">
        {user ? (
          <>
            {pageSubtitle.replace(/\{credits\}/g, String((user.credits as number) ?? 0))}
            {!hasCreditBalanceLabel(pageSubtitle) && (
              <>
                {' '}{t('currentCredits')}
                <strong style={{ color: 'var(--gold-bright)' }}>{(user.credits as number) ?? 0}</strong>
              </>
            )}
          </>
        ) : (
          pageSubtitle
        )}
      </p>

      {promoEnabled && promoBanner && (
        <div className="promo-banner" role="alert">
          {promoBanner}
        </div>
      )}

      {paidStatus === 'success' && (
        <div className="auth-success" role="status" style={{ marginBottom: '1.5rem' }}>
          {t('successMessage')}
        </div>
      )}
      {paidStatus === 'cancel' && (
        <div className="auth-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          {t('cancelMessage')}
        </div>
      )}

      <CreditPackages packages={packages} loggedIn={!!user} />

      {noticeEnabled && (
        <section className="credit-notice">
          <h3>{t('noticeTitle')}</h3>
          {customNotice ? (
            <div className="credit-notice-body">
              <RichText content={customNotice} />
            </div>
          ) : (
            <ul>
              <li>{t('notice1')}</li>
              <li>{t('notice2')}</li>
              <li>{t('notice3')}</li>
              <li>{t('notice4')}</li>
              <li>{t('notice5')}</li>
            </ul>
          )}
        </section>
      )}
    </>
  )
}

function hasCreditBalanceLabel(text: string): boolean {
  const normalized = text.toLowerCase()
  return normalized.includes('点券') || normalized.includes('credits') || normalized.includes('credit')
}
