'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { Class, Spec, Version } from '../payload-types'

type MaybeRef<T> = T | number | null | undefined

function isPopulated<T extends object>(value: MaybeRef<T>): value is T {
  return !!value && typeof value === 'object'
}

function wowName(tWow: ReturnType<typeof useTranslations>, slug: string, fallback: string | undefined | null): string {
  try {
    return tWow(slug)
  } catch {
    return fallback || slug
  }
}

export function ClassTag({ value }: { value: MaybeRef<Class> }) {
  const tWow = useTranslations('wow')
  const locale = useLocale()
  if (!isPopulated(value)) return null
  const fb = locale === 'en' ? value.nameEn : value.nameZh
  return (
    <span className="tag class" data-class={value.slug}>
      {wowName(tWow, value.slug, fb)}
    </span>
  )
}

export function SpecTag({ value }: { value: MaybeRef<Spec> }) {
  const tWow = useTranslations('wow')
  const locale = useLocale()
  if (!isPopulated(value)) return null
  const fb = locale === 'en' ? value.nameEn : value.nameZh
  return <span className="tag spec">{wowName(tWow, value.slug, fb)}</span>
}

export function VersionTag({ value }: { value: MaybeRef<Version> }) {
  if (!isPopulated(value)) return null
  return <span className="tag version">v{value.label}</span>
}

export function TierTag({ tier }: { tier: 'regular' | 'premium' }) {
  const tTier = useTranslations('tier')
  return <span className={`tag tier-${tier}`}>{tTier(tier)}</span>
}
