import type { Metadata } from 'next'
import { getPayload } from '../../../lib/payload'
import { RichText } from '../../../components/RichText'
import type { Page } from '../../../payload-types'

export const metadata: Metadata = {
  title: '关于 FlyMacro',
  description: '关于 FlyMacro：站点、团队与服务条款。',
}

export const revalidate = 300

async function findAboutPage(): Promise<Page | null> {
  const payload = await getPayload()
  const r = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: 'about' } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
  })
  return (r.docs[0] as Page | undefined) ?? null
}

export default async function AboutPage() {
  const page = await findAboutPage()

  return (
    <div className="container-page page-single">
      <article className="macro-detail">
        <header className="detail-header">
          <h1>{page?.title ?? '关于 FlyMacro'}</h1>
        </header>
        <div className="detail-content">
          {page?.body ? (
            <RichText content={page.body} />
          ) : (
            <FallbackAbout />
          )}
        </div>
      </article>
    </div>
  )
}

function FallbackAbout() {
  return (
    <>
      <p>
        FlyMacro 是为魔兽世界玩家打造的 <strong>合法 UI 宏</strong> 与插件分享平台。我们专注于提供
        实战经验沉淀的高质量宏脚本，覆盖全部 13 个职业与 38 个专精，并紧跟最新版本更新。
      </p>
      <h2>我们的承诺</h2>
      <ul>
        <li>所有宏 <strong>仅基于暴雪官方 API</strong> 开发，不修改客户端，绝不触发反作弊系统。</li>
        <li>免费宏永久免费，付费宏一次购买永久使用，所有版本更新免费下发。</li>
        <li>购买后 7 日内不满意可申请退款（已使用激活码情况除外）。</li>
        <li>专业客服团队 <strong>24 小时内响应工单</strong>，确保每一位玩家的问题得到解决。</li>
      </ul>
      <h2>联系我们</h2>
      <p>
        遇到任何问题，请通过页面右上角进入 <strong>个人中心</strong> 提交工单，或发送邮件至{' '}
        <a href="mailto:support@flymacro.qzz.io">support@flymacro.qzz.io</a>。
      </p>
    </>
  )
}
