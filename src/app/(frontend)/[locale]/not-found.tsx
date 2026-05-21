'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations('nav')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '4rem 1.5rem',
    }}>
      <div style={{
        fontFamily: 'var(--font-hero)',
        fontSize: 'clamp(4rem, 10vw, 7rem)',
        fontWeight: 900,
        color: 'var(--gold-bright)',
        textShadow: '0 0 30px rgba(255, 209, 0, 0.4), 0 2px 0 rgba(0,0,0,0.6)',
        lineHeight: 1,
        marginBottom: '1rem',
      }}>
        404
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
        fontWeight: 600,
        letterSpacing: '0.1em',
        color: 'var(--gold)',
        marginBottom: '1rem',
      }}>
        {t('notFoundTitle')}
      </h1>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '1rem',
        maxWidth: '420px',
        marginBottom: '2rem',
        lineHeight: 1.7,
      }}>
        {t('notFoundDesc')}
      </p>
      <Link
        href="/"
        className="btn btn-primary"
        style={{ textDecoration: 'none' }}
      >
        {t('backToHome')}
      </Link>
    </div>
  )
}
