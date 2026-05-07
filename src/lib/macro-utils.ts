import type { Macro } from '../payload-types'


export function extractTagValues(field: Macro['tags']): string[] {
  if (!Array.isArray(field)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of field) {
    if (typeof item === 'object' && item !== null && 'value' in item) {
      const v = (item as { value?: string }).value?.trim()
      if (v && !seen.has(v)) {
        seen.add(v)
        out.push(v)
      }
    }
  }
  return out
}

export function isMacroTier(
  macro: Macro,
  tier: 'free' | 'standard' | 'premium',
): boolean {
  if (tier === 'free') return macro.price === 0
  if (tier === 'standard') return (macro.price ?? 0) > 0 && (macro.price ?? 0) < 200
  return (macro.price ?? 0) >= 200
}

export function formatMacroPrice(price: number | undefined): string {
  if (price === undefined || price === null) return '0'
  return price.toLocaleString('zh-CN')
}
