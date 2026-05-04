import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AuthForm } from '../../../components/AuthForm'
import { OAuthButtons } from '../../../components/OAuthButtons'
import { getCurrentUser } from '../../../lib/auth'

export const metadata: Metadata = {
  title: '登录 — FlyMacro',
}

type SearchParams = Promise<{ return?: string; error?: string; message?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const returnUrl = sanitizeReturnUrl(sp.return)
  const oauthError = sp.error === 'oauth' ? sp.message : undefined
  const user = await getCurrentUser()
  if (user) redirect(returnUrl)

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>登 录</h1>
          <p className="detail-subtitle">欢迎回到 FlyMacro</p>
        </header>
        <div className="auth-body">
          {oauthError && (
            <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
              {oauthError}
            </div>
          )}
          <AuthForm mode="login" returnUrl={returnUrl} />
          <OAuthButtons returnUrl={returnUrl} />
          <p className="auth-help">
            管理员账号请前往
            <Link href="/admin" style={{ marginLeft: 4 }}>
              /admin
            </Link>
            。
          </p>
        </div>
      </article>
    </div>
  )
}

function sanitizeReturnUrl(input?: string): string {
  if (!input) return '/account'
  if (!input.startsWith('/') || input.startsWith('//')) return '/account'
  return input
}
