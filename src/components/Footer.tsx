import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

export function Footer() {
  const year = new Date().getFullYear()
  const t = useTranslations('nav')

  return (
    <footer className="site-footer">
      <div className="container-page">
        <div className="footer-links">
          <Link href="/contact">{t('contact')}</Link>
        </div>
        <p>© {year} FlyMacro</p>
      </div>
    </footer>
  )
}
