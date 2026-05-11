'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations('nav')
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function switchTo(target: string) {
    setOpen(false)
    router.replace(pathname, { locale: target })
  }

  const label = locale === 'zh' ? '中文' : 'EN'

  return (
    <div ref={ref} style={{ position: 'relative', marginLeft: '0.25rem' }}>
      <button
        type="button"
        className="btn lang-switcher"
        onClick={() => setOpen(!open)}
        style={{
          padding: '0.35rem 0.6rem',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
        aria-label={t('switchLang')}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.35rem',
            background: 'var(--bg-surface, #1a1a2e)',
            border: '1px solid var(--border-soft, #2a2a3e)',
            borderRadius: 4,
            minWidth: '6.5rem',
            zIndex: 100,
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <button
            type="button"
            onClick={() => switchTo('zh')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8rem',
              background: locale === 'zh' ? 'var(--gold-dim, rgba(255,215,0,0.08))' : 'transparent',
              color: locale === 'zh' ? 'var(--gold-bright)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '1rem' }}>🇨🇳</span>
            中文
            {locale === 'zh' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 'auto' }}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => switchTo('en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8rem',
              background: locale === 'en' ? 'var(--gold-dim, rgba(255,215,0,0.08))' : 'transparent',
              color: locale === 'en' ? 'var(--gold-bright)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '1rem' }}>🇺🇸</span>
            English
            {locale === 'en' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 'auto' }}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
