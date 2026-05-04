import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/flymacro'

  return (
    <footer className="site-footer">
      <div className="container-page">
        <div className="footer-links">
          <Link href="/contact">联系客服</Link>
          <span aria-hidden="true">·</span>
          <a href={telegramUrl} target="_blank" rel="noopener" aria-label="Telegram">
            Telegram
          </a>
          <span aria-hidden="true">·</span>
          <Link href="/account/tickets/new">提交工单</Link>
          <span aria-hidden="true">·</span>
          <Link href="/about">关于我们</Link>
        </div>
        <p>© {year} FlyMacro · 魔兽世界宏命令库 · 为你的冒险而生</p>
      </div>
    </footer>
  )
}
