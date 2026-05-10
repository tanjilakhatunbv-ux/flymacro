'use client'

import { useLocale } from 'next-intl'

export function LanguageSwitcher() {
  const locale = useLocale()

  return (
    <button
      type="button"
      className="btn lang-switcher"
      onClick={() => {
        const currentPath = window.location.pathname
        if (locale === 'zh') {
          window.location.href = `/en${currentPath}`
        } else {
          window.location.href = currentPath.replace(/^\/en/, '') || '/'
        }
      }}
      style={{
        padding: '0.35rem 0.65rem',
        fontSize: '0.78rem',
        marginLeft: '0.25rem',
        minWidth: '2.2rem',
        textAlign: 'center',
      }}
      aria-label={locale === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      {locale === 'zh' ? 'EN' : '中'}
    </button>
  )
}
