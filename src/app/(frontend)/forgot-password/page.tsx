import type { Metadata } from 'next'
import { AuthForm } from '../../../components/AuthForm'

export const metadata: Metadata = {
  title: '忘记密码 — FlyMacro',
}

export default function ForgotPasswordPage() {
  return (
    <div className="container-page page-single">
      <article className="auth-card">
        <header className="detail-header">
          <h1>忘记密码</h1>
          <p className="detail-subtitle">输入邮箱，我们会发送重置链接</p>
        </header>
        <div className="auth-body">
          <AuthForm mode="forgot" />
        </div>
      </article>
    </div>
  )
}
