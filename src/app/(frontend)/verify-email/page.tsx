import type { Metadata } from 'next'
import Link from 'next/link'
import { VerifyEmailRunner } from '../../../components/VerifyEmailRunner'

export const metadata: Metadata = {
  title: '验证邮箱 — FlyMacro',
}

type SearchParams = Promise<{ token?: string }>

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const token = sp.token ?? ''

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>验证邮箱</h1>
        </header>
        <div className="auth-body">
          {token ? (
            <VerifyEmailRunner token={token} />
          ) : (
            <p className="auth-help">
              链接无效或缺少 token。请重新检查邮件，或
              <Link href="/login" style={{ marginLeft: 4 }}>
                返回登录
              </Link>
              。
            </p>
          )}
        </div>
      </article>
    </div>
  )
}
