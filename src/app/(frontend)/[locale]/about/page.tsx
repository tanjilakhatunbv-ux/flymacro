import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })

  return (
    <div className="container-page page-single">
      <article className="macro-detail">
        <header className="detail-header">
          <h1>{t('pageTitle')}</h1>
        </header>
        <div className="detail-content">
          {locale === 'en' ? <AboutEn /> : <AboutZh />}
        </div>
      </article>
    </div>
  )
}

function AboutZh() {
  return (
    <>
      <p>
        <strong>FlyMacro</strong> 是一个面向<strong>魔兽世界（World of Warcraft）</strong>玩家的插件下载、
        宏代码教程与宏配置服务平台。玩家可以免费下载插件，学习宏代码写法，使用免费基础宏，
        也可以用点券兑换高级宏配置。
      </p>

      <h2>我们提供什么</h2>

      <h3>免费插件下载</h3>
      <p>
        FlyMacro 插件可在魔兽世界游戏中为玩家显示动作技能推荐与循环提示。插件免费下载，
        适合想要更清晰查看战斗提示的玩家使用。
      </p>

      <h3>宏代码教程与免费基础宏</h3>
      <p>
        网站提供宏代码教程，帮助玩家了解常用宏语法和编写思路。玩家也可以直接查看和使用免费基础宏，
        用于日常游戏场景。
      </p>

      <h3>高级宏配置</h3>
      <p>
        高级宏配置按职业和专精整理，适合希望节省配置时间的玩家。玩家可购买点券，
        并使用点券兑换需要的高级宏配置。
      </p>

      <h2>服务方式</h2>
      <p>
        FlyMacro 采用免费内容与点券兑换并行的服务方式：
      </p>
      <ul>
        <li><strong>免费内容</strong>：插件下载、宏代码教程、免费基础宏。</li>
        <li>
          <strong>点券兑换</strong>：购买点券后，可用于兑换高级宏配置。
        </li>
      </ul>

      <h2>联系我们</h2>
      <p>
        遇到任何问题，请通过页面右上角进入 <strong>个人中心</strong> 提交工单，或发送邮件至{' '}
        <a href="mailto:support@flymacro.qzz.io">support@flymacro.qzz.io</a>。
      </p>
    </>
  )
}

function AboutEn() {
  return (
    <>
      <p>
        <strong>FlyMacro</strong> is a service platform for{' '}
        <strong>World of Warcraft (WoW)</strong> players, offering AddOn downloads, macro coding guides,
        and macro setup services. Players can download the free AddOn, learn macro coding, use free basic
        macros, or redeem premium macro setups with Credits.
      </p>

      <h2>What We Offer</h2>

      <h3>Free AddOn Download</h3>
      <p>
        The FlyMacro AddOn shows action suggestions and rotation hints inside World of Warcraft. It is free
        to download and designed for players who want clearer combat guidance.
      </p>

      <h3>Macro Coding Guides & Free Basic Macros</h3>
      <p>
        The website provides macro coding guides to help players understand common syntax and setup ideas.
        Players can also view and use free basic macros for everyday gameplay.
      </p>

      <h3>Premium Macro Setups</h3>
      <p>
        Premium macro setups are organized by class and specialization for players who want ready-to-use
        configurations. Players can use Credits to redeem the premium macro setups they need.
      </p>

      <h2>How It Works</h2>
      <p>
        FlyMacro combines free content with Credit-based redemption:
      </p>
      <ul>
        <li>
          <strong>Free Content</strong>: AddOn download, macro coding guides, and free basic macros.
        </li>
        <li>
          <strong>Credit Redemption</strong>: Use Credits to redeem premium macro setups.
        </li>
      </ul>

      <h2>Contact Us</h2>
      <p>
        For any inquiries, please submit a ticket via <strong>Account Center</strong> in the top-right corner,
        or email us at <a href="mailto:support@flymacro.qzz.io">support@flymacro.qzz.io</a>.
      </p>
    </>
  )
}
