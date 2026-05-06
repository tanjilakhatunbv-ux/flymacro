/**
 * Seed a 50-line macro code into the test macro for end-to-end testing.
 * Run with: pnpm tsx --env-file=.env src/scripts/seed-macro-code.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const MACRO_SLUG = 'druid-balance-mythic'

const SAMPLE_CODE = `#showtooltip 星涌术
/cast [nostealth] 星涌术
/cast [stealth] 潜行
/use [combat] 13
/use [combat] 14
/cast [target=mouseover,harm,nodead][] 月火术
/cast [target=mouseover,harm,nodead][] 阳炎术
/cast 星辰坠落
/cast 自然之力
/cast 艾露恩之怒
/cast [target=focus,harm,nodead] 纠缠根须
/cast [target=arena1] 旋风
/cast [target=arena2] 旋风
/cast [target=arena3] 旋风
/cast [@player] 野性印记
/cast [target=mouseover,help,nodead][@player] 回春术
/cast [target=mouseover,help,nodead][@player] 愈合
/cast [target=mouseover,help,nodead][@player] 生命绽放
/cast [target=mouseover,help,nodead][@player] 迅捷治愈
/cast [target=mouseover,help,nodead][@player] 铁木树皮
/cast [target=mouseover,help,nodead][@player] 树皮术
/cast [target=mouseover,help,nodead][@player] 狂暴回复
/cast [target=mouseover,help,nodead][@player] 甘霖
/cast [target=mouseover,help,nodead][@player] 宁静
/cast [target=mouseover,help,nodead][@player] 复生
/cast [target=mouseover,help,nodead][@player] 起死回生
/cast [target=mouseover,help,nodead][@player] 解除诅咒
/cast [target=mouseover,help,nodead][@player] 净化腐蚀
/cast [target=mouseover,harm,nodead][] 日光术
/cast [target=mouseover,harm,nodead][] 迎头痛击
/cast [target=mouseover,harm,nodead][] 割碎
/cast [target=mouseover,harm,nodead][] 凶猛撕咬
/cast [target=mouseover,harm,nodead][] 斜掠
/cast [target=mouseover,harm,nodead][] 撕碎
/cast [target=mouseover,harm,nodead][] 横扫
/cast [target=mouseover,harm,nodead][] 痛击
/cast [target=mouseover,harm,nodead][] 裂伤
/cast [target=mouseover,harm,nodead][] 痛击
/cast [target=mouseover,harm,nodead][] 横扫
/cast [target=mouseover,harm,nodead][] 撕碎
/cast [target=mouseover,harm,nodead][] 斜掠
/cast [target=mouseover,harm,nodead][] 凶猛撕咬
/cast [target=mouseover,harm,nodead][] 割碎
/cast [target=mouseover,harm,nodead][] 迎头痛击
/cast [target=mouseover,harm,nodead][] 日光术
/cast [target=mouseover,harm,nodead][] 净化腐蚀
/cast [target=mouseover,harm,nodead][] 解除诅咒
/cast [target=mouseover,harm,nodead][] 复生
/cast [target=mouseover,harm,nodead][] 宁静
/cast [target=mouseover,harm,nodead][] 甘霖
/cast [target=mouseover,harm,nodead][] 狂暴回复
/cast [target=mouseover,harm,nodead][] 树皮术
/cast [target=mouseover,harm,nodead][] 铁木树皮
/cast [target=mouseover,harm,nodead][] 迅捷治愈
/cast [target=mouseover,harm,nodead][] 生命绽放
/cast [target=mouseover,harm,nodead][] 愈合
/cast [target=mouseover,harm,nodead][] 回春术
/cast [target=mouseover,harm,nodead][] 野性印记
/cast [target=mouseover,harm,nodead][] 星辰坠落
/cast [target=mouseover,harm,nodead][] 艾露恩之怒
/cast [target=mouseover,harm,nodead][] 自然之力
/cast [target=mouseover,harm,nodead][] 星涌术`

async function main() {
  const payload = await getPayload({ config })
  console.log(`[seed-code] looking for macro: ${MACRO_SLUG}`)

  const result = await payload.find({
    collection: 'macros',
    where: { slug: { equals: MACRO_SLUG } },
    limit: 1,
    depth: 0,
  })

  if (result.docs.length === 0) {
    console.error(`[seed-code] macro not found: ${MACRO_SLUG}`)
    process.exit(1)
  }

  const macro = result.docs[0] as any
  console.log(`[seed-code] found macro: ${macro.title} (id=${macro.id})`)
  console.log(`[seed-code] current codeContent length: ${macro.codeContent ? macro.codeContent.length : 0}`)

  await payload.update({
    collection: 'macros',
    id: macro.id,
    data: { codeContent: SAMPLE_CODE } as any,
    overrideAccess: true,
  })

  console.log(`[seed-code] updated codeContent to ${SAMPLE_CODE.length} chars (${SAMPLE_CODE.split('\n').length} lines)`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed-code] failed:', err)
  process.exit(1)
})
