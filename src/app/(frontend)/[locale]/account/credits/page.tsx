import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CreditPurchaseContent } from '../../../../../components/CreditPurchaseContent'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'credits' })
  return { title: t('metadataTitle') }
}

export const revalidate = 300

export default async function AccountCreditsPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Promise<{ paid?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams

  return <CreditPurchaseContent locale={locale} paidStatus={sp.paid} shell="account" />
}
