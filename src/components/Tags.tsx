'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { Class, Spec, Version } from '../payload-types'

type MaybeRef<T> = T | number | null | undefined

function isPopulated<T extends object>(value: MaybeRef<T>): value is T {
  return !!value && typeof value === 'object'
}

export function ClassTag({ value }: { value: MaybeRef<Class> }) {
  const tWow = useTranslations('wow')
  const locale = useLocale()
  if (!isPopulated(value)) return null
  const name = locale === 'en'
    ? (value.nameEn || tWow(value.slug))
    : (value.nameZh || tWow(value.slug))
  return (
    <span className="tag class" data-class={value.slug}>
      {name}
    </span>
  )
}

export function SpecTag({ value }: { value: MaybeRef<Spec> }) {
  const locale = useLocale()
  if (!isPopulated(value)) return null
  const name = locale === 'en'
    ? (value.nameEn || value.nameZh || value.slug)
    : (value.nameZh || value.nameEn || value.slug)
  return <span className="tag spec">{name}</span>
}

export function VersionTag({ value }: { value: MaybeRef<Version> }) {
  if (!isPopulated(value)) return null
  return <span className="tag version">v{value.label}</span>
}

export function TierTag({ tier }: { tier: 'regular' | 'premium' }) {
  const tTier = useTranslations('tier')
  return <span className={`tag tier-${tier}`}>{tTier(tier)}</span>
}
