import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '../../../../components/AuthForm'

export const metadata: Metadata = {
  title: '重置密码 — FlyMacro',
}

type SearchParams = Promise<{ token?: string }>

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const token = sp.token ?? ''

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>重置密码</h1>
        </header>
        <div className="auth-body">
          {token ? (
            <AuthForm mode="reset" resetToken={token} />
          ) : (
            <p className="auth-help">
              链接无效或已过期。请重新申请：
              <Link href="/forgot-password" style={{ marginLeft: 4 }}>
                忘记密码
              </Link>
            </p>
          )}
        </div>
      </article>
    </div>
  )
}
