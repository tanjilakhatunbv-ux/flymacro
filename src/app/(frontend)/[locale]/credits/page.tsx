import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CreditPurchaseContent } from '../../../../components/CreditPurchaseContent'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'credits' })
  return {
    title: t('metadataTitle'),
  }
}

export const revalidate = 300

export default async function CreditsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ paid?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams

  return (
    <div className="container-page page-single">
      <CreditPurchaseContent locale={locale} paidStatus={sp.paid} />
    </div>
  )
}
