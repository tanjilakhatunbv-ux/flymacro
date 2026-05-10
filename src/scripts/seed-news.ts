import { getPayload } from 'payload'
import config from '../payload.config'

function lexicalRichText(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [{ type: 'text', text, version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

function lexicalRichTextWithHeadings(sections: { type: 'heading' | 'paragraph'; text: string; tag?: string }[]) {
  return {
    root: {
      type: 'root',
      children: sections.map((s, i) => {
        if (s.type === 'heading') {
          return {
            type: 'heading',
            tag: s.tag || 'h2',
            children: [{ type: 'text', text: s.text, version: 1 }],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          }
        }
        return {
          type: 'paragraph',
          children: [{ type: 'text', text: s.text, version: 1 }],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        }
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

const newsArticles = [
  {
    title: 'FlyMacro 2.0 正式发布：全新插件架构与智能宏编辑器',
    slug: 'flymacro-2-0-release',
    summary: 'FlyMacro 迎来重大版本更新，采用全新插件架构设计，支持 Lua 原生编写、实时预览与一键部署，让魔兽世界宏命令开发进入智能时代。',
    category: 'version-update',
    author: 'FlyMacro 团队',
    pinned: true,
    publishedAt: '2026-04-28T10:00:00+08:00',
    body: lexicalRichTextWithHeadings([
      { type: 'heading', text: '全新架构，性能飞跃', tag: 'h2' },
      { type: 'paragraph', text: '经过六个月的精心打磨，FlyMacro 2.0 正式与大家见面。本次更新对底层插件架构进行了全面重构，从原来的纯字符串拼接模式升级为基于 AST（抽象语法树）的智能解析引擎，宏命令的生成速度提升了 300%，同时大幅降低了语法错误率。' },
      { type: 'heading', text: '智能宏编辑器', tag: 'h2' },
      { type: 'paragraph', text: '全新的智能编辑器支持 Lua 语法高亮、实时错误检测和自动补全功能。开发者可以在浏览器中直接编写和调试宏命令，所见即所得的编辑体验让宏开发变得前所未有的简单。编辑器还内置了 200+ 常用魔兽世界 API 的智能提示，大幅提升开发效率。' },
      { type: 'heading', text: '一键部署与版本管理', tag: 'h2' },
      { type: 'paragraph', text: '新版本引入了一键部署功能，用户可以将宏命令直接同步到游戏客户端中，无需手动复制粘贴。同时，内置的版本管理系统支持宏命令的历史回溯与对比，确保每次修改都有迹可循。' },
      { type: 'heading', text: '社区生态升级', tag: 'h2' },
      { type: 'paragraph', text: '我们同时推出了宏命令交易平台，开发者可以将自己精心制作的宏命令发布到平台供其他玩家使用。优质内容创作者还能获得积分奖励，形成良性循环的社区生态。' },
      { type: 'paragraph', text: '立即体验 FlyMacro 2.0，开启智能宏开发新时代！' },
    ]),
  },
  {
    title: '深度解析：魔兽世界 11.1 版本 API 变更与插件适配指南',
    slug: 'wow-11-1-api-changes-guide',
    summary: '魔兽世界 11.1 版本带来了大量 API 变更，本文将深入分析这些变化对插件开发的影响，并提供完整的适配方案和最佳实践。',
    category: 'tech-share',
    author: 'FlyMacro 技术组',
    pinned: false,
    publishedAt: '2026-04-15T14:30:00+08:00',
    body: lexicalRichTextWithHeadings([
      { type: 'heading', text: '核心 API 变更概览', tag: 'h2' },
      { type: 'paragraph', text: '魔兽世界 11.1 版本（地心之战第二季）对插件开发接口进行了大规模调整。据统计，本次更新涉及 47 个 API 函数的签名变更、12 个废弃 API 的移除，以及 23 个全新 API 的引入。这些变更主要集中在战斗系统、UI 框架和数据查询三大领域。' },
      { type: 'heading', text: 'C_Timer 变更与异步优化', tag: 'h2' },
      { type: 'paragraph', text: 'C_Timer.After 函数现在支持更精确的回调调度，新增的 C_Timer.AfterPrecise 函数提供亚毫秒级精度的定时器。对于需要高频更新的战斗辅助插件，这一改进意味着更流畅的响应体验。开发者需要注意，旧的 C_Timer.After 在高频调用场景下可能出现回调堆积的问题，建议迁移到新的 API。' },
      { type: 'heading', text: 'UI 框架变更', tag: 'h2' },
      { type: 'paragraph', text: 'Blizzard 在 11.1 中对 XML/UI 模板系统进行了重构。CreateFrame 函数新增了 templateOverrides 参数，允许在创建时动态修改模板属性。这一特性极大地简化了 UI 复用逻辑，但也意味着旧版本的插件如果依赖了模板的默认行为，可能需要显式声明 override 参数。' },
      { type: 'heading', text: '适配建议与迁移路径', tag: 'h2' },
      { type: 'paragraph', text: '我们建议所有插件开发者按照以下步骤进行适配：首先，使用 /dump 命令逐一验证 API 签名是否匹配；其次，重点关注废弃 API 的编译警告；最后，利用 PTR 服务器进行充分的兼容性测试。FlyMacro 平台已更新了所有宏模板以适配 11.1 API，开发者可以直接引用最新模板。' },
      { type: 'paragraph', text: '完整的技术文档已发布在 FlyMacro 教程区，欢迎查阅。' },
    ]),
  },
  {
    title: '从零开始：用 Lua 开发你的第一个魔兽世界战斗辅助插件',
    slug: 'lua-addon-development-tutorial',
    summary: '手把手教你用 Lua 语言开发魔兽世界战斗辅助插件，涵盖环境搭建、核心逻辑编写、事件监听与 UI 界面设计的完整流程。',
    category: 'addon-dev',
    author: 'FlyMacro 技术组',
    pinned: false,
    publishedAt: '2026-03-22T09:00:00+08:00',
    body: lexicalRichTextWithHeadings([
      { type: 'heading', text: '开发环境准备', tag: 'h2' },
      { type: 'paragraph', text: '开发魔兽世界插件的第一步是搭建合适的开发环境。你需要安装一个支持 Lua 语法高亮的代码编辑器（推荐 VS Code 配合 Lua 扩展），以及魔兽世界客户端。插件的文件结构包括 .toc 描述文件、.lua 脚本文件和可选的 .xml 界面文件。FlyMacro 的在线编辑器已经为你准备好了模板项目，一键即可开始开发。' },
      { type: 'heading', text: '理解插件生命周期', tag: 'h2' },
      { type: 'paragraph', text: '每个魔兽世界插件都遵循标准的加载流程：首先解析 .toc 文件获取元信息，然后按照声明的顺序加载文件，最后触发 ADDON_LOADED 事件。你需要在这个事件回调中完成插件的初始化工作，包括注册事件监听器、创建 UI 框架和加载保存的配置数据。' },
      { type: 'heading', text: '核心功能：战斗事件监听', tag: 'h2' },
      { type: 'paragraph', text: '战斗辅助插件的核心是事件驱动机制。通过 RegisterEvent 函数，你的插件可以监听 COMBAT_LOG_EVENT_UNFILTERED 等核心事件，实时获取战斗数据。例如，监听单位施法事件可以实现技能冷却追踪，监听伤害事件可以构建实时 DPS 统计。关键在于合理过滤事件类型，避免不必要的性能开销。' },
      { type: 'heading', text: 'UI 界面设计', tag: 'h2' },
      { type: 'paragraph', text: '使用 CreateFrame API 创建可拖拽的 UI 面板，SetScript 函数为 UI 元素绑定交互逻辑。我们推荐使用 Blizzard 内置的 UI 模板来保持风格一致性。通过 FontString 和 Texture 对象可以灵活地展示文字和图标信息。' },
      { type: 'heading', text: '调试与发布', tag: 'h2' },
      { type: 'paragraph', text: '利用 print() 函数和 /reload 命令进行快速调试。开发完成后，将插件目录打包为 .zip 文件即可分享给其他玩家。你也可以将插件发布到 FlyMacro 平台的插件市场，让更多用户体验你的作品。' },
    ]),
  },
  {
    title: '2026 年魔兽世界插件生态报告：AI 驱动的智能辅助成为主流趋势',
    slug: '2026-wow-addon-ecosystem-report',
    summary: '基于 FlyMacro 平台数据分析，2026 年魔兽世界插件生态呈现三大趋势：AI 智能辅助、云端同步协作、以及低代码开发普及。本文深度解读行业变化。',
    category: 'industry',
    author: 'FlyMacro 研究院',
    pinned: false,
    publishedAt: '2026-03-10T16:00:00+08:00',
    body: lexicalRichTextWithHeadings([
      { type: 'heading', text: '市场规模与增长', tag: 'h2' },
      { type: 'paragraph', text: '根据 FlyMacro 平台的统计数据，2026 年第一季度活跃插件开发者数量同比增长 67%，新发布的插件和宏命令总量突破 50 万条。地心之战资料片的持续更新和第三季预告的发布，为插件生态注入了强劲的增长动力。' },
      { type: 'heading', text: '趋势一：AI 智能辅助', tag: 'h2' },
      { type: 'paragraph', text: 'AI 技术正在深刻改变插件开发方式。FlyMacro 平台的智能宏生成功能已帮助超过 10 万名玩家自动生成个性化宏命令。AI 可以根据玩家职业、天赋选择和战斗场景，智能推荐最优的宏配置方案。未来，我们预计 AI 将在代码补全、Bug 检测和性能优化等方面发挥更大作用。' },
      { type: 'heading', text: '趋势二：云端同步与协作', tag: 'h2' },
      { type: 'paragraph', text: '越来越多的开发者开始使用云端工具进行插件开发。FlyMacro 的在线编辑器支持多人实时协作、版本管理和一键部署，消除了本地环境配置的繁琐步骤。数据显示，使用云端工具的开发者平均开发效率提升了 40%。' },
      { type: 'heading', text: '趋势三：低代码开发普及', tag: 'h2' },
      { type: 'paragraph', text: '低代码/无代码工具降低了插件开发的门槛。通过可视化拖拽和配置化的方式，不具备编程基础的玩家也能创建功能丰富的插件。FlyMacro 的宏模板库已覆盖所有 13 个职业的 39 个专精，用户只需选择模板并微调参数即可获得专业级的宏配置。' },
      { type: 'paragraph', text: '展望未来，魔兽世界插件生态将继续朝着智能化、云端化和普及化的方向发展。FlyMacro 将持续投入技术研发，为社区提供更优质的工具和服务。' },
    ]),
  },
  {
    title: '性能优化实战：让你的魔兽世界插件内存占用降低 80%',
    slug: 'addon-performance-optimization',
    summary: '深入探讨魔兽世界插件性能优化技巧，从内存管理、事件过滤到缓存策略，手把手教你将插件资源占用降到最低，告别卡顿。',
    category: 'tech-share',
    author: 'FlyMacro 技术组',
    pinned: false,
    publishedAt: '2026-02-18T11:00:00+08:00',
    body: lexicalRichTextWithHeadings([
      { type: 'heading', text: '为什么性能优化至关重要', tag: 'h2' },
      { type: 'paragraph', text: '在大型团队副本中，玩家通常同时运行 20-50 个插件。如果每个插件都存在内存泄漏或不必要的事件监听，累积效果将严重影响游戏帧率。根据我们的测试数据，优化后的插件在 25 人团本场景下可以将内存占用从 120MB 降至 24MB，帧率提升约 15-20 FPS。' },
      { type: 'heading', text: '内存管理最佳实践', tag: 'h2' },
      { type: 'paragraph', text: 'Lua 的垃圾回收机制虽然自动，但不当的代码模式仍会导致内存飙升。避免在 OnUpdate 回调中创建临时表（table），这是最常见的内存浪费来源。建议使用对象池模式，在插件初始化时预分配所需的数据结构，在运行时复用而非重新创建。例如，将 local temp = {} 移到函数外部作为模块级变量，可以减少大量 GC 压力。' },
      { type: 'heading', text: '事件过滤与节流', tag: 'h2' },
      { type: 'paragraph', text: 'COMBAT_LOG_EVENT_UNFILTERED 是插件性能的头号杀手——它在一次团本 Boss 战中可能触发数万次。最佳做法是使用 CombatLogGetCurrentEventInfo() 并在回调入口处立即过滤不相关的事件类型。对于必须频繁处理的场景，采用时间节流（throttle）策略，例如每 200ms 批量处理一次事件，而非逐条响应。' },
      { type: 'heading', text: '高效缓存策略', tag: 'h2' },
      { type: 'paragraph', text: '对于不频繁变化的数据（如技能信息、物品属性），应在首次查询后缓存到本地表中，避免重复调用 GetSpellInfo、GetItemInfo 等 API。特别是 GetItemInfo 在首次调用时可能返回 nil（因为客户端需要从服务器获取数据），建议在 ITEM_INFO_RECEIVED 事件中更新缓存。' },
      { type: 'heading', text: '工具推荐', tag: 'h2' },
      { type: 'paragraph', text: '使用 AddonUsage 或 PerfDrop 等插件实时监控各插件的 CPU 和内存占用。FlyMacro 平台内置了性能分析工具，可以在编辑器中直接检测代码中的性能热点。建议在开发阶段就养成性能意识，而非在用户反馈卡顿后再补救。' },
    ]),
  },
]

async function main() {
  const payload = await getPayload({ config })
  console.log('[seed-news] 开始填充新闻数据...')

  // Find or create a media item for covers (we'll skip cover uploads for now)
  for (const article of newsArticles) {
    const existing = await payload.find({
      collection: 'news' as never,
      where: { slug: { equals: article.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`[seed-news] 跳过已存在的文章: ${article.title}`)
      continue
    }

    const created = await payload.create({
      collection: 'news' as never,
      data: {
        ...article,
        _status: 'published',
      } as never,
    }) as Record<string, unknown>

    console.log(`[seed-news] 已创建文章: ${created.title} (${created.id})`)
  }

  console.log('[seed-news] 新闻数据填充完成！')
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed-news] 填充失败:', err)
  process.exit(1)
})
