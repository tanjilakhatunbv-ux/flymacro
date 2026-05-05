import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from '../../../../lib/payload'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { ClassTag, SpecTag, VersionTag, TierTag } from '../../../../components/Tags'
import { RichText } from '../../../../components/RichText'
import { CodeBlock } from '../../../../components/CodeBlock'
import { ExchangeButton } from '../../../../components/ExchangeButton'
import type { Macro, Class, Spec, Version, Media } from '../../../../payload-types'

type Params = Promise<{ slug: string }>

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
}: {
  params: Params
}) {
  const { slug } = await params
  const macro = await findMacroBySlug(slug)
  if (!macro) notFound()

  const user = await getCurrentUser()
  const staff = isStaffRole(user)

  let exchange: any = null
  if (user) {
    exchange = await findUserExchange(user.id, macro.id)
  }

  const now = new Date()
  const expired = exchange?.expiresAt ? new Date(exchange.expiresAt) <= now : false
  const canSeeCode = staff || (exchange && !expired)
  const hasExchanged = !!exchange

  const img = previewUrl(macro)

  return (
    <div className="container-page page-single">
      <article className="macro-detail" data-tier={macro.tier}>
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
            <TierTag tier={macro.tier ?? 'regular'} />
          </div>
        </header>

        {hasExchanged && !expired && (
          <div className="ownership-banner">
            <span className="ownership-icon">✓</span>
            <span>
              你已兑换此宏
              {exchange?.expiresAt
                ? ` · 有效期至 ${exchange.expiresAt.slice(0, 10)}`
                : ' · 永久有效'}
              {exchange?.autoRenew && ' · 自动续费已开启'}
            </span>
          </div>
        )}

        {hasExchanged && expired && (
          <div className="ownership-banner expired">
            <span className="ownership-icon">!</span>
            <span>有效期已过期，请续费后继续使用。</span>
          </div>
        )}

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

        {!canSeeCode && (
          <div className="purchase-area">
            <h3>兑换此宏</h3>
            <div className="macro-price-card">
              <div className="model-header">
                <h4>{macro.title}</h4>
                <span className="model-price">{macro.price} 积分</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {(macro.durationDays ?? 0) === 0
                  ? '永久有效'
                  : `有效期 ${macro.durationDays} 天`}
                {macro.autoRenewable && ' · 支持自动续费'}
              </p>
              <div className="model-actions" style={{ marginTop: '1rem' }}>
                {user ? (
                  <ExchangeButton
                    macroSlug={macro.slug}
                    price={macro.price ?? 0}
                    userCredits={(user.credits as number) ?? 0}
                  />
                ) : (
                  <Link
                    href={`/login?return=/macros/${macro.slug}`}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'block', textAlign: 'center' }}
                  >
                    登录后兑换
                  </Link>
                )}
              </div>
            </div>
            <p className="locked-notice">
              积分不足？<Link href="/account/credits" style={{ marginLeft: 4, color: 'var(--gold-bright)' }}>去充值</Link>
            </p>
          </div>
        )}

        {canSeeCode && exchange?.expiresAt && (
          <div className="purchase-area" style={{ marginTop: '1.5rem' }}>
            <h3>续费管理</h3>
            <div className="macro-price-card">
              <div className="model-header">
                <h4>{macro.title}</h4>
                <span className="model-price">{macro.price} 积分</span>
              </div>
              <div className="model-actions" style={{ marginTop: '0.75rem' }}>
                <ExchangeButton
                  macroSlug={macro.slug}
                  price={macro.price ?? 0}
                  userCredits={(user?.credits as number) ?? 0}
                  mode="renew"
                  exchangeId={exchange.id}
                />
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
