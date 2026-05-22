/* eslint-disable @next/next/no-html-link-for-pages */
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Global error:', error)

  return (
    <html lang="zh-CN">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          background: 'var(--bg-primary, #0a0a0f)',
          color: 'var(--text-primary, #e8e0d0)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2.5rem', color: '#c9a84c', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
            An unexpected error occurred. Please try again or return to the homepage.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '0.6rem 1.5rem',
                background: '#c9a84c',
                color: '#0a0a0f',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
            <a
              href="/"
              style={{
                padding: '0.6rem 1.5rem',
                border: '1px solid #c9a84c',
                color: '#c9a84c',
                borderRadius: '0.5rem',
                textDecoration: 'none',
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
