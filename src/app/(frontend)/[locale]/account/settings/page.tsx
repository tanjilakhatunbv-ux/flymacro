import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsForms } from '../../../../../components/SettingsForms'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'settings' })
  return { title: t('heading') }
}

export default async function SettingsPage({ params }: { params: Params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'settings' })

  return (
    <>
      <h1>{t('heading')}</h1>
      <p className="lead">{t('subtitle')}</p>
      <SettingsForms />
    </>
  )
}
