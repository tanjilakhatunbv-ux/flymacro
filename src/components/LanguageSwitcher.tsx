import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations('nav')
  const pathname = usePathname()

  const label = locale === 'zh' ? '中文' : 'EN'

  return (
    <details className="language-menu">
      <summary
        className="btn lang-switcher"
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
          style={{ flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>

      <div className="language-menu-pop">
        <Link
          href={pathname}
          locale="zh"
          prefetch={false}
          className={locale === 'zh' ? 'language-option language-option-active' : 'language-option'}
        >
          <span className="language-flag">🇨🇳</span>
          中文
          {locale === 'zh' && (
            <svg className="language-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </Link>
        <Link
          href={pathname}
          locale="en"
          prefetch={false}
          className={locale === 'en' ? 'language-option language-option-active' : 'language-option'}
        >
          <span className="language-flag">🇺🇸</span>
          English
          {locale === 'en' && (
            <svg className="language-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </Link>
      </div>
    </details>
  )
}
