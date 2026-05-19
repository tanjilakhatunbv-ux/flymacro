import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { TicketCreateForm } from '../../../../../../components/TicketForms'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ticket' })
  return { title: t('newTicketTitle') }
}

export default async function NewTicketPage({ params }: { params: Params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ticket' })

  return (
    <>
      <h1>{t('newTicketTitle')}</h1>
      <p className="lead">{t('newTicketSubtitle')}</p>
      <TicketCreateForm />
    </>
  )
}
