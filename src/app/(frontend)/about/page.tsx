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
        <strong>FlyMacro</strong> 是一个专注于<strong>魔兽世界（World of Warcraft）</strong>游戏辅助工具的在线服务平台，
        为全球魔兽世界玩家提供<strong>合法合规的游戏插件下载、宏命令编写工具及高级宏产品购买</strong>服务。
        我们的使命是通过技术手段帮助玩家提升游戏体验，让每一位冒险者都能专注于享受游戏本身的乐趣。
      </p>

      <h2>核心业务</h2>

      <h3>游戏插件下载</h3>
      <p>
        FlyMacro 提供经过严格测试的魔兽世界游戏插件（AddOn）下载服务。我们的插件全部基于
        <strong>暴雪娱乐官方 API</strong> 开发，通过魔兽世界内置的插件系统运行，主要功能包括：
        在游戏界面中为玩家提供技能释放推荐、动作优先级提示、冷却时间监控和战斗数据统计等辅助信息。
        所有插件均符合暴雪娱乐的插件开发政策，<strong>不修改游戏客户端、不读取游戏内存、不注入任何代码</strong>，
        完全合法合规。
      </p>

      <h3>宏命令编写工具</h3>
      <p>
        我们提供在线宏命令编辑器，玩家可以使用浏览器直接编写和调试魔兽世界宏脚本。
        编辑器内置语法高亮、实时预览和错误检测功能，支持魔兽世界宏语言（Macro Language）的完整语法。
        基础宏编写功能完全免费开放，降低了宏脚本开发的门槛。
      </p>

      <h3>高级宏产品</h3>
      <p>
        FlyMacro 平台汇集了由资深玩家和开发团队精心制作的高级宏包（Macro Packages），
        覆盖魔兽世界全部 <strong>13 个职业、39 个专精</strong>。
        每个宏包都经过 <strong>200+ 小时的副本与竞技场实战测试</strong>，
        基于精确的技能优先级判定算法，响应延迟低于 16ms。
        高级宏采用积分制购买，玩家可通过平台完成在线支付后即时获取授权使用。
      </p>

      <h2>商业模式</h2>
      <p>
        FlyMacro 采用<strong>免费增值（Freemium）</strong>模式运营：
      </p>
      <ul>
        <li><strong>免费服务</strong>：基础宏编写工具、免费宏包下载、插件下载、教程文档等。</li>
        <li>
          <strong>付费服务</strong>：高级宏包购买（积分制），提供多种积分充值套餐（如 10/20/100 积分），
          支持信用卡和电子钱包等方式在线支付。
        </li>
      </ul>

      <h2>合规与安全</h2>
      <ul>
        <li>所有产品<strong>仅基于暴雪官方 API</strong> 开发，符合暴雪娱乐最终用户许可协议（EULA）。</li>
        <li>不涉及任何游戏外挂、自动化脚本或违反游戏规则的工具。</li>
        <li>支付流程由第三方支付平台（DodoPayments）安全处理，FlyMacro 不存储任何信用卡或支付敏感信息。</li>
        <li>用户数据采用加密存储，严格遵守隐私保护政策。</li>
      </ul>

      <h2>我们的承诺</h2>
      <ul>
        <li>免费宏永久免费，付费宏一次购买永久使用，版本更新免费下发。</li>
        <li>购买后 7 日内不满意可申请退款（已使用激活码情况除外）。</li>
        <li>专业客服团队 24 小时内响应工单，确保每一位玩家的问题得到及时解决。</li>
      </ul>

      <h2>联系我们</h2>
      <p>
        遇到任何问题，请通过页面右上角进入 <strong>个人中心</strong> 提交工单，或发送邮件至{' '}
        <a href="mailto:support@flymacro.qzz.io">support@flymacro.qzz.io</a>。
      </p>

      <hr />

      <h2>About FlyMacro</h2>

      <p>
        <strong>FlyMacro</strong> is an online service platform dedicated to{' '}
        <strong>World of Warcraft (WoW)</strong> gaming accessories. We provide{' '}
        <strong>legal game addon downloads, macro command authoring tools, and premium macro products</strong>{' '}
        for WoW players worldwide. Our mission is to enhance the gaming experience through technology,
        allowing every adventurer to focus on enjoying the game itself.
      </p>

      <h2>Core Services</h2>

      <h3>Game Addon Downloads</h3>
      <p>
        FlyMacro offers thoroughly tested World of Warcraft game addons for download. All our addons are
        developed using <strong>Blizzard Entertainment&apos;s official API</strong> and run through WoW&apos;s
        built-in addon system. Key features include: in-game skill cast recommendations, action priority hints,
        cooldown monitoring, and combat statistics. All addons comply with Blizzard&apos;s addon development
        policy — <strong>no client modification, no memory reading, no code injection</strong> — fully legal
        and compliant.
      </p>

      <h3>Macro Command Authoring Tool</h3>
      <p>
        We provide an online macro editor that allows players to write and debug WoW macro scripts directly
        in their browser. The editor features syntax highlighting, real-time preview, and error detection,
        with full support for WoW Macro Language syntax. The basic macro authoring tool is completely free to use.
      </p>

      <h3>Premium Macro Products</h3>
      <p>
        FlyMacro hosts premium macro packages crafted by veteran players and our development team, covering
        all <strong>13 classes and 39 specializations</strong> in World of Warcraft. Each macro package undergoes{' '}
        <strong>200+ hours of raid and arena testing</strong>, utilizing precise skill priority algorithms
        with response latency under 16ms. Premium macros are purchased through a credits system — players
        can complete online payments via the platform and gain instant access.
      </p>

      <h2>Business Model</h2>
      <p>
        FlyMacro operates on a <strong>Freemium</strong> model:
      </p>
      <ul>
        <li>
          <strong>Free Services</strong>: Basic macro editor, free macro downloads, addon downloads, tutorials
          and documentation.
        </li>
        <li>
          <strong>Paid Services</strong>: Premium macro packages (credits-based), with various credit top-up
          packages (e.g., 10/20/100 credits) supporting credit card and e-wallet payments.
        </li>
      </ul>

      <h2>Compliance &amp; Security</h2>
      <ul>
        <li>
          All products are developed <strong>exclusively using Blizzard&apos;s official API</strong>, fully
          compliant with Blizzard Entertainment&apos;s End User License Agreement (EULA).
        </li>
        <li>No game hacks, automation scripts, or rule-violating tools are involved.</li>
        <li>
          Payment processing is handled securely by our third-party payment provider (DodoPayments). FlyMacro
          does not store any credit card or sensitive payment information.
        </li>
        <li>User data is encrypted at rest, strictly following privacy protection policies.</li>
      </ul>

      <h2>Our Commitments</h2>
      <ul>
        <li>Free macros remain free forever. Paid macros are one-time purchases with free lifetime updates.</li>
        <li>7-day refund policy for unsatisfied purchases (excluding activated license keys).</li>
        <li>Dedicated support team responds to tickets within 24 hours.</li>
      </ul>

      <h2>Contact Us</h2>
      <p>
        For any inquiries, please submit a ticket via <strong>Account Center</strong> in the top-right corner,
        or email us at <a href="mailto:support@flymacro.qzz.io">support@flymacro.qzz.io</a>.
      </p>
    </>
  )
}
