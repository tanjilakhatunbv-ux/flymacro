import type { Class, Spec, Version } from '../payload-types'
import { classLabel, specLabel } from '../lib/wow'

type MaybeRef<T> = T | number | null | undefined

function isPopulated<T extends object>(value: MaybeRef<T>): value is T {
  return !!value && typeof value === 'object'
}

export function ClassTag({ value }: { value: MaybeRef<Class> }) {
  if (!isPopulated(value)) return null
  return (
    <span className="tag class" data-class={value.slug}>
      {value.nameZh ?? classLabel(value.slug)}
    </span>
  )
}

export function SpecTag({ value }: { value: MaybeRef<Spec> }) {
  if (!isPopulated(value)) return null
  return <span className="tag spec">{value.nameZh ?? specLabel(value.slug)}</span>
}

export function VersionTag({ value }: { value: MaybeRef<Version> }) {
  if (!isPopulated(value)) return null
  return <span className="tag version">v{value.label}</span>
}

export function TierTag({ tier }: { tier: 'regular' | 'premium' }) {
  return <span className={`tag tier-${tier}`}>{tier === 'regular' ? '普通宏' : '高级宏'}</span>
}
