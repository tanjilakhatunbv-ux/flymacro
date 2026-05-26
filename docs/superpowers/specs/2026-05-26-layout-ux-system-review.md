# FlyMacro 视觉与交互设计审计报告

日期：2026-05-26  
分支：`design/layout-ux-system-review`  
审计范围：前台网站、宏资源目录、账户中心、Payload 后台、自定义后台运营组件。

## 工具状态

已修复 Codex 侧 UI/UX Pro Max 安装。原问题是 `C:\Users\Administrator\.codex\skills\ui-ux-pro-max\scripts` 和 `data` 被安装成普通文本文件，内容指向不存在的相对路径。已从完整的 `C:\Users\Administrator\.claude\skills\ui-ux-pro-max` 复制真实 `scripts/` 与 `data/` 目录到 Codex 技能目录。

修复后已成功运行：

```powershell
python C:/Users/Administrator/.codex/skills/ui-ux-pro-max/scripts/search.py "gaming addon macro marketplace directory dark fantasy developer tool dashboard admin panel" --design-system -p "FlyMacro" -f markdown
python C:/Users/Administrator/.codex/skills/ui-ux-pro-max/scripts/search.py "marketplace directory search filters card grid" --domain product -n 8
python C:/Users/Administrator/.codex/skills/ui-ux-pro-max/scripts/search.py "animation accessibility z-index loading filters mobile navigation forms" --domain ux -n 12
python C:/Users/Administrator/.codex/skills/ui-ux-pro-max/scripts/search.py "dark gaming marketplace professional dashboard" --domain style -n 8
python C:/Users/Administrator/.codex/skills/ui-ux-pro-max/scripts/search.py "marketplace search hero CTA categories featured listings trust safety" --domain landing -n 8
```

## UI/UX Pro Max 设计系统结论

FlyMacro 更接近 `Marketplace / Directory`，不是传统企业 SaaS。核心转化应当围绕“搜索、筛选、浏览资源、兑换/下载”展开。UI/UX Pro Max 对该类型的建议是：Hero 搜索优先、分类清晰、精选资源、信任/安全说明、降低搜索摩擦。

适配 FlyMacro 后，推荐方向是：

- 前台：`Marketplace / Directory` + `Dark Mode (OLED)` + 轻量游戏质感。
- 资源列表：搜索框是主 CTA，筛选是辅助工具。
- 后台：`Data-Dense Dashboard`，强调表格、表单、状态、批量操作，不套用前台暗黑奇幻装饰。
- 视觉原则：保留 WoW 金色与职业色作为品牌资产，但减少全站泛化发光、边角装饰、uppercase 和阴影。

## 总体评分

- 品牌辨识度：8/10。暗黑、金色、职业色和宏卡片气质明确。
- 信息架构：6/10。页面齐全，但前台、账户中心、后台的信息密度没有分层。
- 视觉层级：5/10。装饰强度过于平均，很多页面都像重点区域。
- 交互可用性：6/10。基本状态有，但筛选、菜单、后台高风险动作还不够稳。
- 移动端体验：5/10。响应式基础存在，但筛选、账户表格、横向滚动区需要重新设计。
- 可访问性：5/10。已有 aria 与部分 focus，但全局 focus-visible、触控尺寸、键盘菜单、颜色语义仍需补齐。
- 后台运营效率：4/10。Payload 基础可用，自定义组件编码、内联样式和高风险操作确认是主要短板。

## P0 必修问题

### 1. 修复中文乱码与结构性 icon 问题

多个后台组件与语言切换源码出现乱码，例如：

- `src/components/admin/CreditsField.tsx`
- `src/components/admin/RedeemCodeBatchGenerator.tsx`
- `src/components/admin/ResetPasswordButton.tsx`
- `src/components/admin/RedeemCodeField.tsx`
- `src/components/admin/StatusField.tsx`
- `src/components/LanguageSwitcher.tsx`

风险：

- 后台运营人员看不懂确认信息，容易误操作积分、兑换码、密码重置。
- 语言切换使用 emoji 旗帜，违反 UI/UX Pro Max 的“结构性图标不用 emoji”原则，也会受系统字体影响。

建议：

1. 统一源码为 UTF-8，修复所有乱码文案。
2. 语言切换使用文本 `中文 / EN` 或 SVG globe/check 图标，不使用 emoji flag。
3. 对高风险后台操作文案做统一格式：对象、动作、后果、是否可撤销。

### 2. 建立语义 token 层

当前 `tokens.css` 有品牌色，但语义层不足。源码中已经出现大量未统一定义或依赖 fallback 的变量：

- `--border-soft`
- `--bg-card`
- `--card-bg`
- `--radius`
- `--bg-primary`
- `--text-primary`
- `--bg-secondary`
- `--success`
- `--danger`
- `--error`

这些变量散落在 CSS 和 TSX 内联样式里，说明设计系统正在自然扩张，但源头未收敛。

建议新增：

```css
:root {
  --surface-page: #0a0807;
  --surface-panel: #15110d;
  --surface-card: #1a1817;
  --surface-input: #0f0c09;

  --border-subtle: rgba(212, 175, 55, 0.14);
  --border-default: #3a2f24;
  --border-emphasis: #8c7339;
  --border-focus: #ffd100;

  --text-primary: #f4e6c8;
  --text-secondary: #a89880;
  --text-tertiary: #75695a;
  --text-inverse: #120a00;

  --state-success: #22c55e;
  --state-warning: #f97316;
  --state-danger: #ef4444;
  --state-info: #3b82f6;

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}
```

### 3. 全局补齐 focus-visible 与触控尺寸

UI/UX Pro Max 将 Focus States 和 Touch Target Size 标为高优先级。当前 `.btn`、`.filter-btn`、`.tag-link`、`.user-menu-trigger`、`.language-menu summary` 等都有 hover/active，但全局 `:focus-visible` 不完整。

建议：

- 全局定义 `:focus-visible`，至少 2px 外环，颜色用 `--border-focus`。
- 移动端所有交互目标最小 44px 高度。
- 横向 chip 列表保持 8px 以上间距，避免误触。

## 前台网站审计

### 首页

当前优势：

- Hero 有强品牌记忆点。
- Featured Macros 与 Getting Started 结构清楚。
- 图标和装饰资源与主题一致。

主要问题：

- UI/UX Pro Max 对 marketplace/directory 的建议是“Hero Search Bar 是 CTA”，但当前首页主 CTA 只有“进入宏列表”，搜索入口没有出现在首屏。
- `hero-rune` 使用无限 pulse 动画，虽然 reduced-motion 下会关闭，但常态下属于装饰性持续动画。UI/UX Pro Max 建议 infinite animation 只用于 loading。
- 首页两个 section 都使用同等级装饰标题、分割线、卡片动画，层级略满。

优化建议：

1. 首屏增加宏搜索框：输入关键词后进入 `/macros?q=...`。
2. CTA 从单按钮改成“搜索 + 浏览全部 + 热门职业/版本快捷入口”。
3. Hero 保留装饰，但把 rune pulse 改为一次性进入动画或静态图标。
4. Featured Macros 卡片保留完整主题；Getting Started 降低装饰强度，像帮助模块而不是同级营销模块。

### 全站导航

当前优势：

- `Header.tsx` 使用 `aria-current` 和 nav aria-label。
- 桌面端三列布局清楚。

主要问题：

- 移动端导航变成横向滚动，但隐藏 scrollbar，用户不一定知道还有更多项。
- 7 个主导航项对移动端偏多。
- `site-nav a` 字距较大并 uppercase，在中文界面下会降低可读性。
- 语言切换 `details/summary` 可用但缺少更精细的键盘菜单管理。

优化建议：

1. 桌面保留当前导航结构，移动端改为“核心 4 项 + 更多”或抽屉菜单。
2. 中文 locale 下取消 uppercase 风格影响，英文可保留小字距。
3. 横向滚动如果保留，要加渐隐遮罩或“更多”提示。
4. 用户菜单支持方向键导航，打开后 focus 进入菜单或至少 Escape/Tab 路径明确。

### 宏列表与筛选

当前优势：

- 搜索、职业、专精、版本、标签、tier 都已具备。
- 使用 query string，URL 可分享。
- `aria-pressed` 和 `aria-busy` 已存在。

主要问题：

- 筛选项平铺过多，移动端变成多条横向滚动 chip 区。
- 搜索框没有成为 marketplace 的主 CTA。
- 没有“已选条件摘要”和“一键清除某个条件”。
- `router.push(..., { scroll: false })` 会保留滚动位置，筛选后用户可能不知道结果变化。
- `filter-strip-label` 最小宽度只有 2.5rem，中文标签与长文本容易拥挤。

优化建议：

1. 桌面端：搜索区独占第一行，筛选折叠为 `职业 / 专精 / 版本 / 标签 / 高级筛选`。
2. 移动端：顶部只保留搜索、筛选按钮、结果数量；筛选项进入 bottom sheet。
3. 增加 selected chips：`牧师 x`、`11.0.7 x`、`#raid x`。
4. 筛选后滚动到结果标题或更新结果计数区域，避免用户停在旧滚动位置。
5. 标签过多时不要一次平铺全部，按热度展示 Top N，剩余用搜索或展开。

### 宏卡片

当前优势：

- 16:9 媒体比例稳定，图片 lazy load。
- 品质色和职业色增强了 WoW 语义。
- 价格、持续时间、owned 状态都有信息位。

主要问题：

- 卡片整体 `cursor: pointer`，但实际可点击区域分散在图片、标题、标签；会造成“看起来整卡可点但不是整卡可点”的错觉。
- hover 同时改变边框、阴影、transform、角标尺寸、图片 scale，动效层级过多。
- `aria-hidden="true"` 用在图片链接上，但链接仍可聚焦的可能性需要确认。若链接可聚焦却 aria-hidden，会对读屏不友好。
- `+N` 标签只是静态数量，没有展开或说明。

优化建议：

1. 让整张卡片主区域成为一个明确链接，标签作为次级链接时视觉上与主点击分开。
2. hover 只保留 1-2 个变化：边框高亮 + 轻微阴影，不再放大角标。
3. 如果图片链接只是重复标题链接，应移除其可聚焦性或改成装饰图，不要 `aria-hidden` 包住可交互链接。
4. `+N` 支持 hover/focus tooltip 或详情页完整标签。

### 内容阅读页

当前问题：

- 详情、指南、新闻、博客复用大量金色标题、边框、发光，长文阅读容易疲劳。
- 正文宽度、代码块、图片、blockquote 基础不错，但标题装饰仍偏强。

优化建议：

1. 详情页采用“正文阅读容器 760-840px + 右侧操作栏”。
2. 下载/兑换/购买放入 sticky action panel，移动端放在标题后。
3. 阅读页只保留一层品牌装饰，正文标题不要每级都发光。

## 账户中心审计

当前优势：

- 侧栏 + 内容区的结构正确。
- 概览页已有积分、兑换、订单、工单、通知数据。

主要问题：

- 账户中心仍像主题卡片页，不像高效任务控制台。
- 账户页和交易页大量内联样式，扫描结果显示全项目约 285 处 `style={{...}}`，账户与后台是重灾区。
- 交易页用 CSS grid 模拟表格，列宽固定：`140px 100px 80px 100px 1fr`，移动端容易溢出或压缩。
- `var(--success)` / `var(--danger)` 被使用但 token 未定义，金额颜色可能失效。

优化建议：

1. 账户首页改为 operational dashboard：余额、可用宏、未读通知、待处理工单四个 KPI + 最近动作。
2. 账户侧栏分组：资产、宏服务、支持、设置；后台入口固定底部并弱化。
3. 桌面使用真正表格或统一 list row；移动端改为交易卡片。
4. 将账户页面的内联布局抽成 class：`account-actions-grid`、`account-info-list`、`account-data-list`。
5. 标题尺度降级：账户页 H1 不用营销级 uppercase 或强发光。

## 后台系统审计

当前优势：

- Payload 后台 route 独立，前后台样式不会天然混在一起。
- `custom.css` 已处理中文字体栈。
- 批量兑换码、积分调整、状态字段、密码重置等运营能力已经具备。

主要问题：

- 后台组件大量内联样式，缺少统一 admin UI primitives。
- 多处乱码影响操作信任。
- 高风险操作使用浏览器 `confirm` 或轻量弹层，缺少统一确认模型。
- 弹窗 z-index 使用 `9999`，UI/UX Pro Max 明确建议定义 z-index scale，避免任意大值。
- 表单缺少必填标识、帮助文本、提交后的可恢复路径。

优化建议：

1. 新建后台小型组件样式层：
   - `admin-panel`
   - `admin-panel__header`
   - `admin-field-grid`
   - `admin-field`
   - `admin-button`
   - `admin-button--primary`
   - `admin-button--danger`
   - `admin-alert`
   - `admin-dialog`
   - `admin-code-output`
2. 积分调整弹窗增加“调整后余额”预览，原因必填，负数显示 danger。
3. 批量兑换码生成改成三段式：参数输入、生成预览、结果输出。
4. 密码重置弹窗展示目标用户邮箱，并说明只发送邮件不直接修改密码。
5. z-index 定义 token：dropdown 50、sticky 60、dialog 100、toast 120。

## 可访问性审计

高优先级问题：

- 缺少统一 `:focus-visible`。
- 移动端部分 chip/button 小于 44px 或间距偏紧。
- 横向滚动区域隐藏 scrollbar，缺少替代提示。
- 色彩语义依赖颜色，部分状态没有图标/文本强化。
- 自定义菜单没有完整 menu keyboard pattern。

建议：

1. 全局 focus ring。
2. 所有 icon-only 或紧凑按钮补 `aria-label`。
3. Toast/错误/成功消息使用 `aria-live="polite"` 或 `role="alert"`。
4. 状态色旁边加文字或图标，不只靠颜色。
5. 表单错误自动 focus 到第一个错误字段。

## 视觉系统建议

### 保留

- 暗色基调。
- 金色作为品牌强调。
- WoW 职业色与品质色。
- 宏卡片的物品感。
- 首页和精选区的 fantasy 资产。

### 减少

- 全站 uppercase 和过大字距。
- 每个标题都发光。
- 所有卡片都有角标装饰。
- hover 同时触发多种运动。
- 运营后台使用前台游戏化视觉。

### 新增

- 搜索优先的 marketplace 首页。
- 页面类型分层：营销、目录、阅读、账户、后台。
- 账户中心任务控制台。
- 后台 admin UI primitives。
- 语义 token 层和 z-index scale。

## 优化路线图

### 第一阶段：信任和基础系统

1. 修复乱码。
2. 修复 UI/UX Pro Max 安装已完成。
3. 补齐语义 token 和 z-index scale。
4. 增加全局 focus-visible。
5. 将后台高风险操作改为统一 dialog。

### 第二阶段：Marketplace 核心体验

1. 首页增加搜索 Hero。
2. 重构宏筛选为桌面分组 + 移动 bottom sheet。
3. 增加已选筛选摘要。
4. 简化宏卡片 hover 和链接结构。
5. 优化空状态和结果计数。

### 第三阶段：账户与后台效率

1. 账户首页改 dashboard。
2. 交易、订单、兑换、通知统一 list/table/card 响应式模式。
3. 后台组件去内联样式，抽 admin class。
4. 批量兑换码与积分调整增加预览、确认和成功反馈。

### 第四阶段：视觉精修

1. 分层调整标题尺度。
2. 降低阅读页装饰强度。
3. 优化动效节奏，只保留有意义的 motion。
4. 做 375、768、1024、1440 四档视觉 QA。

## 验证记录

- worktree：`.worktrees/layout-ux-system-review`
- 分支：`design/layout-ux-system-review`
- 已运行：`pnpm install --frozen-lockfile`
- 已运行：`pnpm exec tsc --noEmit`，通过。
- 已修复：UI/UX Pro Max 的 `scripts/` 与 `data/`。
- 已验证：`search.py --design-system`、`--domain product`、`--domain ux`、`--domain style`、`--domain landing` 均可运行。
- 已尝试本地页面：Next dev server 可启动，但 `/zh` 与 `/admin/login` 因缺少 `DATABASE_POOLED_URI` 或 `DATABASE_URI` 无法完整渲染。
- 运行时视觉截图未完成，原因是当前 worktree 只有 `.env.example`，没有可用数据库连接。

## 建议下一步

优先做一张实施任务拆分表，从 P0 开始：

1. 编码与文案修复。
2. token/focus/z-index 基础层。
3. 首页搜索和宏列表筛选重构。
4. 账户中心 dashboard。
5. 后台运营组件系统化。
