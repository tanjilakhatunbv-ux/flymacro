import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '联系客服 — FlyMacro',
  description: '遇到问题？通过工单、Telegram 或微信联系 FlyMacro 客服团队。',
}

export default function ContactPage() {
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/flymacro'
  const wechatQrUrl = process.env.NEXT_PUBLIC_WECHAT_QR_URL || '/images/wechat-qr.png'

  return (
    <div className="container-page page-single">
      <article className="auth-card" style={{ maxWidth: 720 }}>
        <header className="detail-header">
          <h1>联系客服</h1>
          <p className="detail-subtitle">我们随时为你解答问题</p>
        </header>

        <div className="auth-body" style={{ gap: '2rem' }}>
          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
              推荐：提交工单
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              对于账号问题、充值异常、宏使用疑问等，提交工单是最快获得正式回复的方式。我们的客服团队通常在 24 小时内回复。
            </p>
            <Link href="/account/tickets/new" className="btn btn-primary">
              提交新工单
            </Link>
          </section>

          <div className="user-menu-sep" role="separator" style={{ margin: '0.5rem 0' }} />

          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
              即时通讯
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', border: '1px solid var(--border-soft)', borderRadius: 3 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Telegram</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  适合英文/中文交流，响应较快。
                </p>
                <a href={telegramUrl} target="_blank" rel="noopener" className="btn" style={{ fontSize: '0.85rem' }}>
                  打开 Telegram
                </a>
              </div>

              <div style={{ padding: '1rem', border: '1px solid var(--border-soft)', borderRadius: 3 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>微信</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  扫码添加客服微信。
                </p>
                <div style={{ width: 120, height: 120, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={wechatQrUrl} alt="微信客服二维码" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          </section>

          <div className="user-menu-sep" role="separator" style={{ margin: '0.5rem 0' }} />

          <section>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
              常见问题
            </h3>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
              <li>充值后积分未到账？请先确认支付已完成，通常 1-5 分钟内自动到账。如超过 10 分钟未到账，请提交工单并附上支付截图。</li>
              <li>宏代码无法显示？请确认你已兑换该宏且未过期。免费宏无需兑换即可查看。</li>
              <li>自动续费失败？系统会在到期当天尝试扣款，如积分不足会停止自动续费并通知你。充值积分后可手动续费。</li>
              <li>积分不支持退款。充值前请阅读充值须知。</li>
            </ul>
          </section>
        </div>
      </article>
    </div>
  )
}
