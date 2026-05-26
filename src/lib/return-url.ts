const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/

export function sanitizeReturnUrl(input: string | null | undefined, fallback = '/account'): string {
  if (!input) return fallback

  const value = input.trim()
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  if (CONTROL_CHAR_PATTERN.test(value)) return fallback

  try {
    const url = new URL(value, 'https://flymacro.local')
    if (url.origin !== 'https://flymacro.local') return fallback
    return `${url.pathname}${url.search}${url.hash}` || fallback
  } catch {
    return fallback
  }
}
