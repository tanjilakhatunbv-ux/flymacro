import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AuthForm } from '../../../components/AuthForm'
import { OAuthButtons } from '../../../components/OAuthButtons'
import { getCurrentUser } from '../../../lib/auth'

export const metadata: Metadata = {
  title: '注册 — FlyMacro',
}

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect('/account')

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>注 册</h1>
          <p className="detail-subtitle">创建 FlyMacro 账号，开始你的冒险</p>
        </header>
        <div className="auth-body">
          <AuthForm mode="register" turnstileSiteKey={turnstileSiteKey || undefined} />
          <OAuthButtons />
          <p className="auth-help">
            注册即表示你同意我们的
            <a href="/about" style={{ margin: '0 4px' }}>
              服务条款与隐私政策
            </a>
            。我们会向你的邮箱发送验证邮件以激活账号。
          </p>
        </div>
      </article>
    </div>
  )
}
