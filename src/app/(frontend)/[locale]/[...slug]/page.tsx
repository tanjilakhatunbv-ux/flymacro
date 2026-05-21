import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

export const metadata: Metadata = {
  title: '404 — Page Not Found | FlyMacro',
}

export default function CatchAllPage({ params }: { params: Promise<{ locale: string; slug: string[] }> }) {
  // This catch-all only exists to serve a branded 404 for unmatched routes.
  // Valid routes are handled by their own page.tsx files, so this only
  // triggers when no other route matches.
  void params

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
        Page Not Found
      </h1>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '1rem',
        maxWidth: '420px',
        marginBottom: '2rem',
        lineHeight: 1.7,
      }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="btn btn-primary"
        style={{ textDecoration: 'none' }}
      >
        Back to Home
      </Link>
    </div>
  )
}
