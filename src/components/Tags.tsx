'use client'

import { useTranslations } from 'next-intl'
import type { Class, Spec, Version } from '../payload-types'

type MaybeRef<T> = T | number | null | undefined

function isPopulated<T extends object>(value: MaybeRef<T>): value is T {
  return !!value && typeof value === 'object'
}

export function ClassTag({ value }: { value: MaybeRef<Class> }) {
  const tWow = useTranslations('wow')
  if (!isPopulated(value)) return null
  return (
    <span className="tag class" data-class={value.slug}>
      {tWow(value.slug)}
    </span>
  )
}

export function SpecTag({ value }: { value: MaybeRef<Spec> }) {
  const tWow = useTranslations('wow')
  if (!isPopulated(value)) return null
  return <span className="tag spec">{tWow(value.slug)}</span>
}

export function VersionTag({ value }: { value: MaybeRef<Version> }) {
  if (!isPopulated(value)) return null
  return <span className="tag version">v{value.label}</span>
}

export function TierTag({ tier }: { tier: 'regular' | 'premium' }) {
  const tTier = useTranslations('tier')
  return <span className={`tag tier-${tier}`}>{tTier(tier)}</span>
}
