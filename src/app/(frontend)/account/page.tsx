import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentUser } from '../../../lib/auth'
import { getPayload } from '../../../lib/payload'

export const metadata: Metadata = {
  title: '个人中心 — FlyMacro',
}

export default async function AccountHome() {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()
  const [exchanges, creditOrders, openTickets, unreadNotifs] = await Promise.all([
    payload.count({
      collection: 'macro-exchanges',
      where: { user: { equals: user.id } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'credit-orders',
      where: { user: { equals: user.id } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'tickets',
      where: {
        and: [{ user: { equals: user.id } }, { status: { in: ['open', 'in-progress'] } }],
      },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'notifications',
      where: { and: [{ recipient: { equals: user.id } }, { read: { equals: false } }] },
      overrideAccess: true,
    }),
  ])

  const display = user.name || user.email.split('@')[0]
  const verified = (user as { _verified?: boolean })._verified !== false
  const credits = (user.credits as number) ?? 0

  return (
    <>
      <h1>欢迎回来，{display}</h1>
      <p className="lead">在这里管理你的积分、兑换、订单、工单与通知。</p>

      {!verified && (
        <div className="auth-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: 0 }}>
            你的邮箱尚未验证。请前往邮箱点击注册时收到的验证链接。
          </p>
        </div>
      )}

      <section className="account-summary">
        <div className="account-card">
          <h4>当前积分</h4>
          <div className="num" style={{ color: 'var(--gold-bright)' }}>{credits}</div>
        </div>
        <div className="account-card">
          <h4>已兑换宏</h4>
          <div className="num">{exchanges.totalDocs}</div>
        </div>
        <div className="account-card">
          <h4>充值订单</h4>
          <div className="num">{creditOrders.totalDocs}</div>
        </div>
        <div className="account-card">
          <h4>处理中工单</h4>
          <div className="num">{openTickets.totalDocs}</div>
        </div>
        <div className="account-card">
          <h4>未读通知</h4>
          <div className="num">{unreadNotifs.totalDocs}</div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Link href="/macros" className="btn">
          浏览宏库
        </Link>
        <Link href="/account/credits" className="btn btn-primary">
          充值积分
        </Link>
        <Link href="/account/tickets/new" className="btn">
          提交工单
        </Link>
        <Link href="/account/exchanges" className="btn">
          查看已兑换宏
        </Link>
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '1rem' }}>
          账号信息
        </h2>
        <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '0.6rem', fontSize: '0.92rem' }}>
          <dt style={{ color: 'var(--text-muted)' }}>邮箱</dt>
          <dd style={{ margin: 0 }}>{user.email}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>昵称</dt>
          <dd style={{ margin: 0 }}>{user.name || '（未设置）'}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>积分</dt>
          <dd style={{ margin: 0, color: 'var(--gold-bright)' }}>{credits}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>角色</dt>
          <dd style={{ margin: 0 }}>{roleLabel(user.role ?? 'user')}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>邮箱状态</dt>
          <dd style={{ margin: 0 }}>{verified ? '已验证' : '未验证'}</dd>
        </dl>
      </section>
    </>
  )
}

function roleLabel(role: string): string {
  switch (role) {
    case 'super-admin':
      return '超级管理员'
    case 'operator':
      return '运营'
    case 'support':
      return '客服'
    default:
      return '普通用户'
  }
}
