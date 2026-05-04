# FlyMacro Next — 魔兽世界宏库（Next.js + Payload CMS 重构版）

替代旧版 Hugo + Sveltia CMS 站点，新增用户系统、付费购买、统一后台。

## 技术栈

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Payload CMS 3** —— 与 Next.js 同进程，自带后台 UI
- **PostgreSQL**（Neon Free 起步）
- **Cloudflare R2**（S3 兼容，零下载流量费）
- **Resend**（仅注册验证 + 忘记密码）
- **Cloudflare Turnstile**（防机器人）
- **DodoPayments**（MoR 支付，支持卡/UPI/支付宝/微信，兼容中国身份）
- **Vercel Hobby** 部署

起步成本：**0 元/月**

## 本地开发

### 1. 安装依赖

```bash
# 如未安装 pnpm
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

至少必须填：

- `DATABASE_URI` —— Neon 控制台获取（[neon.tech](https://neon.tech)）
- `PAYLOAD_SECRET` —— `openssl rand -base64 48` 生成 32+ 字符随机串
- `NEXT_PUBLIC_SERVER_URL` —— 本地填 `http://localhost:3000`

其他服务（R2 / Resend / Turnstile / DodoPayments / OAuth）可后续逐步开通，未配置时对应功能自动跳过。

### 3. 初始化数据库 + 种子数据

```bash
pnpm seed
```

执行后会：
- 自动创建所有 14 个 collection 的表结构
- 写入 13 个职业、39 个专精、4 个版本号
- 创建超级管理员账号（默认 `admin@flymacro.local` / `ChangeMe!2026`，可通过 `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` 覆盖）

> seed 脚本是幂等的，可重复执行。

### 4. 启动开发服务器

```bash
pnpm dev
```

- 前台：[http://localhost:3000](http://localhost:3000)
- 后台：[http://localhost:3000/admin](http://localhost:3000/admin)

首次访问 `/admin` 用 seed 创建的超级管理员登录，**请立刻修改密码**。

## 项目结构

```
flymacro-next/
├── src/
│   ├── app/
│   │   ├── (frontend)/         # 用户端页面
│   │   │   ├── layout.tsx      # 全局布局 + 暗黑主题
│   │   │   └── page.tsx        # 首页
│   │   └── (payload)/          # Payload 路由
│   │       ├── admin/[[...segments]]/   # 后台 UI
│   │       ├── api/[...slug]/           # REST/Auth API
│   │       ├── api/graphql/             # GraphQL endpoint
│   │       └── layout.tsx               # Payload root layout
│   ├── collections/            # Payload collections (14 个)
│   │   ├── Users.ts            # RBAC: super-admin/operator/support/user
│   │   ├── Macros.ts           # 核心：付费宏代码字段会按购买记录过滤
│   │   ├── Classes.ts, Specs.ts, Versions.ts
│   │   ├── Guides.ts, Articles.ts, Pages.ts
│   │   ├── Orders.ts, Purchases.ts
│   │   ├── Tickets.ts, TicketMessages.ts
│   │   ├── Notifications.ts
│   │   └── Media.ts
│   ├── lib/
│   │   └── access.ts           # 通用 access control 函数
│   ├── scripts/
│   │   └── seed.ts             # 种子数据脚本
│   ├── styles/
│   │   └── globals.css         # 暗黑魔兽主题
│   ├── payload.config.ts       # Payload 主配置
│   └── payload-types.ts        # 自动生成（运行 pnpm generate:types）
├── public/                     # 静态资源（待从旧站迁移）
└── .env.example
```

## 角色权限

| 操作 | super-admin | operator | support | user |
|------|:-:|:-:|:-:|:-:|
| 后台访问 | ✓ | ✓ | ✓ | ✗ |
| 用户管理 | ✓ | 仅查看 | ✗ | 仅自己 |
| 角色分配 | ✓ | ✗ | ✗ | ✗ |
| 宏发布/编辑 | ✓ | ✓ | ✗ | ✗ |
| 订单查看 | ✓ | ✓ | ✗ | 仅自己 |
| 订单退款 | ✓ | ✗ | ✗ | ✗ |
| 工单分配 | ✓ | ✓ | ✗ | ✗ |
| 工单回复 | ✓ | ✓ | ✓ | 仅自己提的 |
| 购买宏 | ✓ | ✓ | ✓ | ✓ |

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（端口 3000） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm seed` | 写入/更新种子数据 + 超管账号 |
| `pnpm generate:types` | 根据 collections 生成 `payload-types.ts` |
| `pnpm migrate:content` | 迁移旧 Hugo 站点的宏与页面（待实现） |

## 部署到 Vercel

1. 将本目录推送到 GitHub
2. [vercel.com](https://vercel.com) 新建项目，关联仓库
3. **Framework Preset** 选 `Next.js`
4. **Root Directory** 设为 `flymacro-next`（如果旧站还在同仓库）
5. 在 Settings → Environment Variables 中粘贴 `.env` 的所有值
6. 部署后在 Cloudflare DNS 把 `flymacro.qzz.io` 的 CNAME 指向 Vercel

## 路线图

- [x] **Week 1**：项目基础 + 14 collections + RBAC + seed
- [ ] **Week 2**：前台页面（首页 / 列表 / 详情 / 教程 / 公告 / 关于）+ 主题移植
- [ ] **Week 3**：用户系统（注册/登录/OAuth/Turnstile/邮箱验证 + 工单 + 通知）
- [ ] **Week 4**：DodoPayments 支付集成 + 购买流程 + 订单页
- [ ] **Week 5**：内容迁移 + 端到端测试 + DNS 切换上线

## 备注

- 旧 Hugo 站点保留在同级目录 `flymacro/`，重构期间继续可访问。
- 为避免运营成本，前期所有第三方服务都使用免费档；流量上来后再视情况升级。
