import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from '../../../../lib/payload'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { ClassTag, SpecTag, VersionTag, TypeTag } from '../../../../components/Tags'
import { RichText } from '../../../../components/RichText'
import { CodeBlock } from '../../../../components/CodeBlock'
import { ExchangeButton } from '../../../../components/ExchangeButton'
import type { Macro, Class, Spec, Version, Media } from '../../../../payload-types'

type Params = Promise<{ slug: string }>
type SearchParams = Promise<{ paid?: string }>

export const revalidate = 30

function isMedia(v: unknown): v is Media {
  return !!v && typeof v === 'object' && 'url' in (v as Record<string, unknown>)
}

function previewUrl(macro: Macro): string | null {
  const img = macro.previewImg
  if (!isMedia(img)) return null
  return img.sizes?.hero?.url ?? img.url ?? null
}

async function findMacroBySlug(slug: string) {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'macros',
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    limit: 1,
    depth: 2,
  })
  return (result.docs[0] as Macro | undefined) ?? null
}

async function findUserExchange(userId: number, macroId: number) {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: userId } },
        { macro: { equals: macroId } },
      ],
    },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs[0] as any) ?? null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const macro = await findMacroBySlug(slug)
  if (!macro) return { title: '宏不存在 — FlyMacro' }
  return {
    title: `${macro.title} — FlyMacro`,
    description: macro.summary ?? undefined,
  }
}

export default async function MacroDetailPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { slug } = await params
  const sp = await searchParams
  const macro = await findMacroBySlug(slug)
  if (!macro) notFound()

  const user = await getCurrentUser()
  const staff = isStaffRole(user)

  let exchange: any = null
  if (user && macro.type === 'premium') {
    exchange = await findUserExchange(user.id, macro.id)
  }

  const now = new Date()
  const expired = exchange?.expiresAt ? new Date(exchange.expiresAt) <= now : false
  const canSeeCode = macro.type === 'free' || staff || (exchange && !expired)

  const img = previewUrl(macro)
  const paidStatus = sp.paid

  return (
    <div className="container-page page-single">
      <article className="macro-detail" data-type={macro.type}>
        {paidStatus === 'success' && (
          <div className="auth-success" role="status" style={{ margin: '1rem 1.5rem 0' }}>
            充值成功！积分已到账，现在可以兑换宏了。
          </div>
        )}
        {paidStatus === 'cancel' && (
          <div className="auth-error" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
            充值已取消。如有问题请联系客服。
          </div>
        )}
        <header className="detail-header">
          <h1>{macro.title}</h1>
          <div className="detail-meta">
            {(macro.classes ?? []).map((c, i) => (
              <ClassTag key={`c-${i}`} value={c as number | Class} />
            ))}
            {(macro.specs ?? []).map((s, i) => (
              <SpecTag key={`s-${i}`} value={s as number | Spec} />
            ))}
            {(macro.versions ?? []).map((v, i) => (
              <VersionTag key={`v-${i}`} value={v as number | Version} />
            ))}
            <TypeTag type={macro.type} />
          </div>
        </header>

        {img && (
          <div className="detail-preview">
            <Image src={img} alt={macro.title} width={1600} height={900} priority />
          </div>
        )}

        <div className="detail-content">
          {macro.summary && (
            <p style={{ fontFamily: 'var(--font-decor)', fontStyle: 'italic', color: 'var(--text-muted)' }}>
              {macro.summary}
            </p>
          )}
          <RichText content={macro.body} />
        </div>

        {canSeeCode && macro.codeContent && (
          <div className="download-area">
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-bright)', marginBottom: '1.25rem' }}>
              宏命令
            </h3>
            <CodeBlock code={macro.codeContent} language="lua" />
            {exchange?.expiresAt && (
              <p className="hint" style={{ color: expired ? 'var(--text-muted)' : 'var(--gold)' }}>
                {expired
                  ? '有效期已过期，请续费后继续使用。'
                  : `有效期至 ${exchange.expiresAt.slice(0, 10)}`}
                {exchange.autoRenew && !expired && ' · 自动续费已开启'}
              </p>
            )}
            <p className="hint">复制全部内容，粘贴到游戏宏编辑器（按 ESC 输入 /macro），保存即可使用。</p>
          </div>
        )}

        {macro.type === 'premium' && !canSeeCode && (
          <ExchangeSection macro={macro} user={user} />
        )}

        {macro.type === 'premium' && canSeeCode && exchange?.expiresAt && (
          <RenewSection macro={macro} exchange={exchange} user={user} />
        )}
      </article>
    </div>
  )
}

function ExchangeSection({ macro, user }: { macro: Macro; user: any }) {
  const models = (macro.models ?? []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  if (models.length === 0) {
    return (
      <div className="purchase-area">
        <h3>兑换</h3>
        <p style={{ color: 'var(--text-muted)' }}>暂无可兑换型号。</p>
      </div>
    )
  }

  const userCredits = (user?.credits as number) ?? 0

  return (
    <div className="purchase-area">
      <h3>选择型号兑换</h3>
      {user && (
        <div style={{ marginBottom: '1rem', color: 'var(--gold-bright)', fontWeight: 500 }}>
          你的积分：{userCredits}
        </div>
      )}
      <div className="models">
        {models.map((m, i) => (
          <div key={m.id ?? i} className="model-card">
            <div className="model-header">
              <h4>{m.name}</h4>
              <span className="model-price">{m.price} 积分</span>
            </div>
            <ul className="model-features">
              {(m.features ?? []).map((f, fi) => (
                <li key={f.id ?? fi}>{f.value}</li>
              ))}
            </ul>
            <div className="model-actions">
              {user ? (
                <ExchangeButton
                  macroSlug={macro.slug}
                  modelIndex={i}
                  modelName={m.name}
                  price={m.price}
                  userCredits={userCredits}
                />
              ) : (
                <Link
                  href={`/login?return=/macros/${macro.slug}`}
                  className="btn btn-primary"
                >
                  登录后兑换
                </Link>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {(m.durationDays ?? 0) === 0
                ? '永久有效'
                : `有效期 ${m.durationDays} 天`}
              {m.autoRenewable && ' · 支持自动续费'}
            </div>
          </div>
        ))}
      </div>
      <p className="locked-notice">
        积分不足？<Link href="/account/credits" style={{ marginLeft: 4, color: 'var(--gold-bright)' }}>去充值</Link>
      </p>
    </div>
  )
}

function RenewSection({ macro, exchange, user }: { macro: Macro; exchange: any; user: any }) {
  const model = (macro.models ?? []).find((m: any) => m.name === exchange.modelName)
  if (!model) return null

  const userCredits = (user?.credits as number) ?? 0
  const now = new Date()
  const expiresAt = exchange.expiresAt ? new Date(exchange.expiresAt) : null
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="purchase-area" style={{ marginTop: '1.5rem' }}>
      <h3>续费管理</h3>
      <div className="model-card">
        <div className="model-header">
          <h4>{exchange.modelName}</h4>
          <span className="model-price">{model.price} 积分</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {daysLeft !== null && daysLeft > 0
            ? `还剩 ${daysLeft} 天过期`
            : daysLeft !== null && daysLeft <= 0
              ? '已过期'
              : '永久有效'}
        </p>
        <div className="model-actions" style={{ marginTop: '0.75rem' }}>
          <ExchangeButton
            macroSlug={macro.slug}
            modelIndex={(macro.models ?? []).findIndex((m: any) => m.name === exchange.modelName)}
            modelName={exchange.modelName}
            price={model.price}
            userCredits={userCredits}
            mode="renew"
            exchangeId={exchange.id}
          />
        </div>
      </div>
    </div>
  )
}
