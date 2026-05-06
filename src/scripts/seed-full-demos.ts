/**
 * 综合模拟数据种子脚本
 * 生成：测试用户(5个)、宏商品(17个/每职业1个/30行代码)、文章(4篇)、
 *       页面(3个)、积分包(3个)、指南(2篇)、兑换记录(3条)、工单(2个)
 *
 * 运行方式：
 *   npx tsx --env-file=.env src/scripts/seed-full-demos.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

// ═══════════════════════════════════════════════════════════
//  引用数据
// ═══════════════════════════════════════════════════════════

const CLASSES = [
  { slug: 'warrior',     nameZh: '战士',       nameEn: 'Warrior',      color: '#C69B6D', sort: 1 },
  { slug: 'paladin',     nameZh: '圣骑士',     nameEn: 'Paladin',      color: '#F48CBA', sort: 2 },
  { slug: 'hunter',      nameZh: '猎人',       nameEn: 'Hunter',       color: '#AAD372', sort: 3 },
  { slug: 'rogue',       nameZh: '潜行者',     nameEn: 'Rogue',        color: '#FFF468', sort: 4 },
  { slug: 'priest',      nameZh: '牧师',       nameEn: 'Priest',       color: '#FFFFFF', sort: 5 },
  { slug: 'shaman',      nameZh: '萨满祭司',   nameEn: 'Shaman',       color: '#0070DD', sort: 6 },
  { slug: 'mage',        nameZh: '法师',       nameEn: 'Mage',         color: '#3FC7EB', sort: 7 },
  { slug: 'warlock',     nameZh: '术士',       nameEn: 'Warlock',      color: '#8788EE', sort: 8 },
  { slug: 'monk',        nameZh: '武僧',       nameEn: 'Monk',         color: '#00FF98', sort: 9 },
  { slug: 'druid',       nameZh: '德鲁伊',     nameEn: 'Druid',        color: '#FF7C0A', sort: 10 },
  { slug: 'demonhunter', nameZh: '恶魔猎手',   nameEn: 'Demon Hunter', color: '#A330C9', sort: 11 },
  { slug: 'deathknight', nameZh: '死亡骑士',   nameEn: 'Death Knight', color: '#C41E3A', sort: 12 },
  { slug: 'evoker',      nameZh: '唤魔师',     nameEn: 'Evoker',       color: '#33937F', sort: 13 },
]

const SPECS = [
  { slug: 'warrior-arms',       nameZh: '武器',   nameEn: 'Arms',         classSlug: 'warrior',     role: 'melee-dps'  as const, sort: 1 },
  { slug: 'warrior-fury',       nameZh: '狂怒',   nameEn: 'Fury',         classSlug: 'warrior',     role: 'melee-dps'  as const, sort: 2 },
  { slug: 'warrior-protection', nameZh: '防护',   nameEn: 'Protection',   classSlug: 'warrior',     role: 'tank'       as const, sort: 3 },
  { slug: 'paladin-holy',       nameZh: '神圣',   nameEn: 'Holy',         classSlug: 'paladin',     role: 'healer'     as const, sort: 1 },
  { slug: 'paladin-protection', nameZh: '防护',   nameEn: 'Protection',   classSlug: 'paladin',     role: 'tank'       as const, sort: 2 },
  { slug: 'paladin-retribution',nameZh: '惩戒',   nameEn: 'Retribution',  classSlug: 'paladin',     role: 'melee-dps'  as const, sort: 3 },
  { slug: 'hunter-beast-mastery',nameZh:'兽王',  nameEn: 'Beast Mastery',classSlug: 'hunter',      role: 'ranged-dps' as const, sort: 1 },
  { slug: 'hunter-marksmanship',nameZh:'射击',   nameEn: 'Marksmanship', classSlug: 'hunter',      role: 'ranged-dps' as const, sort: 2 },
  { slug: 'hunter-survival',    nameZh: '生存',   nameEn: 'Survival',     classSlug: 'hunter',      role: 'melee-dps'  as const, sort: 3 },
  { slug: 'rogue-assassination',nameZh:'刺杀',   nameEn: 'Assassination',classSlug: 'rogue',       role: 'melee-dps'  as const, sort: 1 },
  { slug: 'rogue-outlaw',       nameZh: '狂徒',   nameEn: 'Outlaw',       classSlug: 'rogue',       role: 'melee-dps'  as const, sort: 2 },
  { slug: 'rogue-subtlety',     nameZh: '敏锐',   nameEn: 'Subtlety',     classSlug: 'rogue',       role: 'melee-dps'  as const, sort: 3 },
  { slug: 'priest-discipline',  nameZh: '戒律',   nameEn: 'Discipline',   classSlug: 'priest',      role: 'healer'     as const, sort: 1 },
  { slug: 'priest-holy',        nameZh: '神圣',   nameEn: 'Holy',         classSlug: 'priest',      role: 'healer'     as const, sort: 2 },
  { slug: 'priest-shadow',      nameZh: '暗影',   nameEn: 'Shadow',       classSlug: 'priest',      role: 'ranged-dps' as const, sort: 3 },
  { slug: 'shaman-elemental',   nameZh: '元素',   nameEn: 'Elemental',    classSlug: 'shaman',      role: 'ranged-dps' as const, sort: 1 },
  { slug: 'shaman-enhancement', nameZh: '增强',   nameEn: 'Enhancement',  classSlug: 'shaman',      role: 'melee-dps'  as const, sort: 2 },
  { slug: 'shaman-restoration', nameZh: '恢复',   nameEn: 'Restoration',  classSlug: 'shaman',      role: 'healer'     as const, sort: 3 },
  { slug: 'mage-arcane',        nameZh: '奥术',   nameEn: 'Arcane',       classSlug: 'mage',        role: 'ranged-dps' as const, sort: 1 },
  { slug: 'mage-fire',          nameZh: '火焰',   nameEn: 'Fire',         classSlug: 'mage',        role: 'ranged-dps' as const, sort: 2 },
  { slug: 'mage-frost',         nameZh: '冰霜',   nameEn: 'Frost',        classSlug: 'mage',        role: 'ranged-dps' as const, sort: 3 },
  { slug: 'warlock-affliction', nameZh: '痛苦',   nameEn: 'Affliction',   classSlug: 'warlock',     role: 'ranged-dps' as const, sort: 1 },
  { slug: 'warlock-demonology', nameZh: '恶魔学识',nameEn:'Demonology',   classSlug: 'warlock',     role: 'ranged-dps' as const, sort: 2 },
  { slug: 'warlock-destruction',nameZh: '毁灭',   nameEn: 'Destruction',  classSlug: 'warlock',     role: 'ranged-dps' as const, sort: 3 },
  { slug: 'monk-brewmaster',    nameZh: '酒仙',   nameEn: 'Brewmaster',   classSlug: 'monk',        role: 'tank'       as const, sort: 1 },
  { slug: 'monk-mistweaver',    nameZh: '织雾',   nameEn: 'Mistweaver',   classSlug: 'monk',        role: 'healer'     as const, sort: 2 },
  { slug: 'monk-windwalker',    nameZh: '踏风',   nameEn: 'Windwalker',   classSlug: 'monk',        role: 'melee-dps'  as const, sort: 3 },
  { slug: 'druid-balance',      nameZh: '平衡',   nameEn: 'Balance',      classSlug: 'druid',       role: 'ranged-dps' as const, sort: 1 },
  { slug: 'druid-feral',        nameZh: '野性',   nameEn: 'Feral',        classSlug: 'druid',       role: 'melee-dps'  as const, sort: 2 },
  { slug: 'druid-guardian',     nameZh: '守护',   nameEn: 'Guardian',     classSlug: 'druid',       role: 'tank'       as const, sort: 3 },
  { slug: 'druid-restoration',  nameZh: '恢复',   nameEn: 'Restoration',  classSlug: 'druid',       role: 'healer'     as const, sort: 4 },
  { slug: 'demonhunter-havoc',  nameZh: '浩劫',   nameEn: 'Havoc',        classSlug: 'demonhunter', role: 'melee-dps'  as const, sort: 1 },
  { slug: 'demonhunter-vengeance',nameZh:'复仇',  nameEn: 'Vengeance',    classSlug: 'demonhunter', role: 'tank'       as const, sort: 2 },
  { slug: 'deathknight-blood',  nameZh: '鲜血',   nameEn: 'Blood',        classSlug: 'deathknight', role: 'tank'       as const, sort: 1 },
  { slug: 'deathknight-frost',  nameZh: '冰霜',   nameEn: 'Frost',        classSlug: 'deathknight', role: 'melee-dps'  as const, sort: 2 },
  { slug: 'deathknight-unholy', nameZh: '邪恶',   nameEn: 'Unholy',       classSlug: 'deathknight', role: 'melee-dps'  as const, sort: 3 },
  { slug: 'evoker-devastation', nameZh: '湮灭',   nameEn: 'Devastation',  classSlug: 'evoker',      role: 'ranged-dps' as const, sort: 1 },
  { slug: 'evoker-preservation',nameZh: '恒护',   nameEn: 'Preservation', classSlug: 'evoker',      role: 'healer'     as const, sort: 2 },
  { slug: 'evoker-augmentation',nameZh: '增辉',   nameEn: 'Augmentation', classSlug: 'evoker',      role: 'ranged-dps' as const, sort: 3 },
]

const VERSIONS = [
  { label: '11.0.5', codename: 'The War Within',  releasedAt: '2024-10-22', isCurrent: true },
  { label: '10.2.7', codename: 'Dragonflight',    releasedAt: '2024-05-07', isCurrent: false },
  { label: '3.3.5',  codename: 'WotLK Classic',   releasedAt: '2010-06-22', isCurrent: false },
]

// ═══════════════════════════════════════════════════════════
//  宏代码模板（每段约 30 行，真实魔兽世界宏语法）
// ═══════════════════════════════════════════════════════════

const MACRO_CODES: Record<string, string> = {
  'warrior-arms': `#showtooltip 致死打击
/cast [mod:shift] 雷霆一击; 致死打击
/cast 巨人打击
/use [combat] 13
/use [combat] 14
/cast 鲁莽
/cast 天神下凡
/cast 剑刃风暴
/cast 猛击
/stopcasting
/cancelaura 保护祝福
/cast [@mouseover,harm,nodead][] 断筋
/cast [@mouseover,harm,nodead][] 冲锋
/cast [@mouseover,harm,nodead][] 拳击
/cast 横扫攻击
/cast 旋风斩
/cast 压制
/cast 撕裂
/cast [@mouseover,help,nodead][@player] 集结呐喊
/cast [@mouseover,help,nodead][@player] 命令怒吼
/cast [@mouseover,help,nodead][@player] 无视痛苦
/cast [target=focus,harm,nodead] 缴械
/cast [target=focus,harm,nodead] 断筋
/script UIErrorsFrame:Clear()
/petattack [@mouseover,harm,nodead][]
/cast 乘胜追击
/cast 胜利在望
/cast 狂暴之怒`,

  'warrior-fury': `#showtooltip 嗜血
/cast [mod:shift] 旋风斩; 嗜血
/cast 怒击
/cast 暴怒
/cast 斩杀
/use [combat] 13
/use [combat] 14
/cast 鲁莽
/cast 天神下凡
/cast 剑刃风暴
/cast 猛击
/stopcasting
/cancelaura 保护祝福
/cast [@mouseover,harm,nodead][] 断筋
/cast [@mouseover,harm,nodead][] 冲锋
/cast [@mouseover,harm,nodead][] 拳击
/cast 浴血奋战
/cast 巨龙怒吼
/cast 奥丁之怒
/cast [@mouseover,help,nodead][@player] 集结呐喊
/cast [@mouseover,help,nodead][@player] 命令怒吼
/cast [@mouseover,help,nodead][@player] 无视痛苦
/cast [target=focus,harm,nodead] 缴械
/script UIErrorsFrame:Clear()
/cast 乘胜追击
/cast 胜利在望
/cast 狂暴之怒
/cast 鲁莽`,

  'paladin-retribution': `#showtooltip 圣殿骑士的裁决
/cast [mod:shift] 神圣风暴; 圣殿骑士的裁决
/cast 审判
/cast 十字军打击
/cast 愤怒之锤
/cast 奉献
/use [combat] 13
/use [combat] 14
/cast 复仇之怒
/cast 征伐
/cast 神圣风暴
/cast 最终清算
/cast 处决宣判
/cast 灰烬觉醒
/cast 公正之剑
/cast [@mouseover,help,nodead][@player] 圣光闪现
/cast [@mouseover,help,nodead][@player] 荣耀圣令
/cast [@mouseover,help,nodead][@player] 保护祝福
/cast [@mouseover,help,nodead][@player] 自由祝福
/cast 圣盾术
/cancelaura 圣盾术
/cast [@mouseover,harm,nodead][] 超度邪恶
/cast [@mouseover,harm,nodead][] 责难
/cast [@mouseover,harm,nodead][] 审判
/script UIErrorsFrame:Clear()
/cast 复仇之怒`,

  'hunter-beast-mastery': `#showtooltip 杀戮命令
/cast [mod:shift] 多重射击; 杀戮命令
/cast 倒刺射击
/cast 眼镜蛇射击
/cast 奇美拉射击
/use [combat] 13
/use [combat] 14
/cast 狂野怒火
/cast 最佳伙伴
/cast 血溅十方
/cast 凶暴野兽
/cast 胁迫
/cast [@mouseover,harm,nodead][] 震荡射击
/cast [@mouseover,harm,nodead][] 夺命射击
/cast [@mouseover,harm,nodead][] 反制射击
/cast 宁神射击
/cast 误导
/cast [@mouseover,help,nodead][@player] 误导
/cast 假死
/cast 意气风发
/cast [@mouseover,help,nodead][@player] 治疗宠物
/cast 复活宠物
/cast 召唤宠物 1
/cast 野兽之眼
/petattack [@mouseover,harm,nodead][]
/petfollow [mod:alt]
/petpassive [mod:ctrl]
/script UIErrorsFrame:Clear()`,

  'hunter-marksmanship': `#showtooltip 瞄准射击
/cast [mod:shift] 多重射击; 瞄准射击
/cast 稳固射击
/cast 急速射击
/cast 奥术射击
/cast 穿刺射击
/use [combat] 13
/use [combat] 14
/cast 百发百中
/cast 夺命之眼
/cast [@mouseover,harm,nodead][] 震荡射击
/cast [@mouseover,harm,nodead][] 夺命射击
/cast [@mouseover,harm,nodead][] 反制射击
/cast 宁神射击
/cast 误导
/cast [@mouseover,help,nodead][@player] 误导
/cast 假死
/cast [@mouseover,help,nodead][@player] 意气风发
/cast [@mouseover,help,nodead][@player] 治疗宠物
/cast 复活宠物
/cast 召唤宠物 1
/cast 束缚射击
/cast [@mouseover,harm,nodead][] 摔绊
/cast [@mouseover,harm,nodead][] 驱散射击
/script UIErrorsFrame:Clear()
/petattack [@mouseover,harm,nodead][]`,

  'rogue-assassination': `#showtooltip 毁伤
/cast [mod:shift] 刀扇; 毁伤
/cast 毒伤
/cast 割裂
/cast 锁喉
/cast 猩红风暴
/cast 君王之灾
/cast 死亡印记
/use [combat] 13
/use [combat] 14
/cast 宿敌
/cast 冲动
/cast 冷血
/cast [@mouseover,harm,nodead][] 肾击
/cast [@mouseover,harm,nodead][] 偷袭
/cast [@mouseover,harm,nodead][] 脚踢
/cast 闪避
/cast 佯攻
/cast 消失
/cast 暗影斗篷
/cast 致盲
/cast [@mouseover,harm,nodead][] 致盲
/cast [@mouseover,harm,nodead][] 闷棍
/cast 嫁祸诀窍
/cast [@mouseover,help,nodead][@player] 嫁祸诀窍
/cast 暗影步
/script UIErrorsFrame:Clear()`,

  'priest-discipline': `#showtooltip 苦修
/cast [mod:shift,@mouseover,help,nodead][@mouseover,help,nodead][mod:shift,@player][@player] 苦修
/cast [@mouseover,help,nodead][@player] 真言术：盾
/cast [@mouseover,help,nodead][@player] 恢复
/cast [@mouseover,help,nodead][@player] 快速治疗
/cast [@mouseover,help,nodead][@player] 真言术：耀
/cast [@mouseover,help,nodead][@player] 暗影愈合
/cast [@mouseover,help,nodead][@player] 痛苦压制
/cast [@mouseover,help,nodead][@player] 罩子
/use [combat] 13
/use [combat] 14
/cast 全神贯注
/cast 福音
/cast [@mouseover,harm,nodead][] 惩击
/cast [@mouseover,harm,nodead][] 神圣之火
/cast [@mouseover,harm,nodead][] 暗言术：痛
/cast [@mouseover,harm,nodead][] 心灵震爆
/cast [@mouseover,harm,nodead][] 暗言术：灭
/cast 消散
/cast [@mouseover,help,nodead][@player] 群体驱散
/cast [@mouseover,help,nodead][@player] 信仰飞跃
/cast [@mouseover,help,nodead][@player] 纯净术
/cast 绝望祷言
/script UIErrorsFrame:Clear()`,

  'priest-holy': `#showtooltip 快速治疗
/cast [@mouseover,help,nodead][@player] 快速治疗
/cast [@mouseover,help,nodead][@player] 治疗术
/cast [@mouseover,help,nodead][@player] 恢复
/cast [@mouseover,help,nodead][@player] 圣言术：静
/cast [@mouseover,help,nodead][@player] 圣言术：灵
/cast [@mouseover,help,nodead][@player] 圣言术：赎
/cast [@mouseover,help,nodead][@player] 守护之魂
/cast [@mouseover,help,nodead][@player] 圣光回响
/use [combat] 13
/use [combat] 14
/cast 神圣赞美诗
/cast 圣言术：罚
/cast [@mouseover,harm,nodead][] 惩击
/cast [@mouseover,harm,nodead][] 神圣之火
/cast [@mouseover,harm,nodead][] 暗言术：痛
/cast [@mouseover,help,nodead][@player] 纯净术
/cast [@mouseover,help,nodead][@player] 信仰飞跃
/cast [@mouseover,help,nodead][@player] 群体驱散
/cast 绝望祷言
/cast 消散
/cast [@mouseover,help,nodead][@player] 渐隐术
/cast 象征希望
/script UIErrorsFrame:Clear()`,

  'shaman-elemental': `#showtooltip 闪电箭
/cast [mod:shift] 地震术; 闪电箭
/cast 熔岩爆裂
/cast 闪电链
/cast 烈焰震击
/cast 冰霜震击
/cast 元素冲击
/cast 大地震击
/use [combat] 13
/use [combat] 14
/cast 火元素
/cast 风暴元素
/cast 升腾
/cast 先祖指引
/cast [@mouseover,help,nodead][@player] 治疗之涌
/cast [@mouseover,help,nodead][@player] 大地之盾
/cast [@mouseover,help,nodead][@player] 治疗链
/cast [@mouseover,harm,nodead][] 风剪
/cast [@mouseover,harm,nodead][] 闪电箭
/cast 嗜血
/cast 英勇
/cast 星界转移
/cast 土元素
/cast 灵魂行者的恩赐
/cast 自然守护者
/cast 雷霆风暴
/script UIErrorsFrame:Clear()`,

  'mage-fire': `#showtooltip 火球术
/cast [mod:shift] 烈焰风暴; 火球术
/cast 炎爆术
/cast 灼烧
/cast 火冲
/cast 烈焰之地
/cast 流星
/cast 龙息术
/use [combat] 13
/use [combat] 14
/cast 燃烧
/cast 时间扭曲
/cast 镜像
/cast [@mouseover,harm,nodead][] 变形术
/cast [@mouseover,harm,nodead][] 法术反制
/cast [@mouseover,harm,nodead][] 寒冰箭
/cast 闪现术
/cast 隐形术
/cast 寒冰屏障
/cancelaura 寒冰屏障
/cast 冰霜新星
/cast 冰霜之环
/cast [@mouseover,help,nodead][@player] 解除诅咒
/cast [@mouseover,help,nodead][@player] 奥术智慧
/cast 缓落术
/script UIErrorsFrame:Clear()`,

  'mage-frost': `#showtooltip 寒冰箭
/cast [mod:shift] 暴风雪; 寒冰箭
/cast 冰枪术
/cast 冰风暴
/cast 寒冰宝珠
/cast 彗星风暴
/cast 冰锥术
/cast 冰霜射线
/use [combat] 13
/use [combat] 14
/cast 冰冷血脉
/cast 时间扭曲
/cast 镜像
/cast [@mouseover,harm,nodead][] 变形术
/cast [@mouseover,harm,nodead][] 法术反制
/cast [@mouseover,harm,nodead][] 深度冻结
/cast 闪现术
/cast 隐形术
/cast 寒冰屏障
/cancelaura 寒冰屏障
/cast 冰霜新星
/cast 冰霜之环
/cast [@mouseover,help,nodead][@player] 解除诅咒
/cast [@mouseover,help,nodead][@player] 奥术智慧
/cast 缓落术
/script UIErrorsFrame:Clear()`,

  'warlock-destruction': `#showtooltip 混乱之箭
/cast [mod:shift] 火焰之雨; 混乱之箭
/cast 烧尽
/cast 燃烧
/cast 暗影灼烧
/cast 灵魂之火
/cast 大灾变
/cast 召唤地狱火
/use [combat] 13
/use [combat] 14
/cast 黑暗灵魂：动荡
/cast 不灭决心
/cast [@mouseover,harm,nodead][] 恐惧
/cast [@mouseover,harm,nodead][] 法术封锁
/cast [@mouseover,harm,nodead][] 死亡缠绕
/cast [@mouseover,harm,nodead][] 浩劫
/cast 灵魂石
/cast [@mouseover,help,nodead][@player] 灵魂石
/cast 制造灵魂井
/cast 生命分流
/cast 暗影护罩
/cast 魔甲术
/cast 恶魔传送门
/cast 灵魂燃烧
/script UIErrorsFrame:Clear()`,

  'monk-windwalker': `#showtooltip 幻灭踢
/cast [mod:shift] 神鹤引项踢; 幻灭踢
/cast 旭日东升踢
/cast 怒雷破
/cast 升龙霸
/cast 真气波
/cast 真气爆裂
/cast 风火雷电
/use [combat] 13
/use [combat] 14
/cast 屏气凝神
/cast 豪能酒
/cast [@mouseover,harm,nodead][] 分筋错骨
/cast [@mouseover,harm,nodead][] 扫堂腿
/cast [@mouseover,harm,nodead][] 切喉手
/cast 业报之触
/cast 壮胆酒
/cast 魂体双分
/cast 魂体转移
/cast [@mouseover,help,nodead][@player] 疗伤珠
/cast [@mouseover,help,nodead][@player] 活血术
/cast [@mouseover,help,nodead][@player] 清创生血
/cast 滚地翻
/script UIErrorsFrame:Clear()`,

  'druid-balance': `#showtooltip 星涌术
/cast [mod:shift] 星辰坠落; 星涌术
/cast 月火术
/cast 阳炎术
/cast 明月打击
/cast 日光术
/cast 艾露恩之怒
/cast 自然之力
/cast 超凡之盟
/use [combat] 13
/use [combat] 14
/cast 化身：艾露恩的选民
/cast [@mouseover,help,nodead][@player] 回春术
/cast [@mouseover,help,nodead][@player] 愈合
/cast [@mouseover,help,nodead][@player] 迅捷治愈
/cast [@mouseover,help,nodead][@player] 铁木树皮
/cast [@mouseover,help,nodead][@player] 树皮术
/cast 乌索尔旋风
/cast [@mouseover,harm,nodead][] 迎头痛击
/cast [@mouseover,harm,nodead][] 纠缠根须
/cast [@mouseover,harm,nodead][] 飓风术
/cast 豹奔
/cast 疾奔
/cast 宁静
/script UIErrorsFrame:Clear()`,

  'demonhunter-havoc': `#showtooltip 混乱打击
/cast [mod:shift] 刃舞; 混乱打击
/cast 邪能冲撞
/cast 眼棱
/cast 死亡横扫
/cast 毁灭
/cast 邪能弹幕
/cast 恶魔追击
/cast 战刃风暴
/use [combat] 13
/use [combat] 14
/cast 恶魔变形
/cast 复仇回避
/cast [@mouseover,harm,nodead][] 禁锢
/cast [@mouseover,harm,nodead][] 瓦解
/cast [@mouseover,harm,nodead][] 悲苦咒符
/cast 暗影步
/cast 幽灵视觉
/cast 疾影
/cast 幻影打击
/cast 灵魂残片
/cast [@mouseover,help,nodead][@player] 吞噬魔法
/cast 滑翔
/script UIErrorsFrame:Clear()`,

  'deathknight-blood': `#showtooltip 心脏打击
/cast [mod:shift] 血液沸腾; 心脏打击
/cast 灵界打击
/cast 骨髓分裂
/cast 符文打击
/cast 枯萎凋零
/cast 符文武器增效
/use [combat] 13
/use [combat] 14
/cast 吸血鬼之血
/cast 冰封之韧
/cast 符文分流
/cast [@mouseover,harm,nodead][] 死亡之握
/cast [@mouseover,harm,nodead][] 心灵冰冻
/cast [@mouseover,harm,nodead][] 绞袭
/cast 黑暗命令
/cast [@mouseover,help,nodead][@player] 反魔法护罩
/cast 亡者领域
/cast 牺牲契约
/cast [@mouseover,help,nodead][@player] 亡者复生
/cast 战复
/cast 召唤石像鬼
/script UIErrorsFrame:Clear()`,

  'evoker-devastation': `#showtooltip 活化烈焰
/cast [mod:shift] 火焰风暴; 活化烈焰
/cast 裂解
/cast 焚烧
/cast 永恒吐息
/cast 焚身
/cast 狂龙之怒
/cast 碧蓝打击
/use [combat] 13
/use [combat] 14
/cast 时间螺旋
/cast 掌控时间
/cast [@mouseover,harm,nodead][] 梦游
/cast [@mouseover,harm,nodead][] 镇压
/cast [@mouseover,harm,nodead][] 击飞
/cast 青铜龙的祝福
/cast [@mouseover,help,nodead][@player] 回响
/cast [@mouseover,help,nodead][@player] 逆转
/cast [@mouseover,help,nodead][@player] 翡翠之花
/cast [@mouseover,help,nodead][@player] 飞升之焰
/cast 深呼吸
/cast 悬空
/script UIErrorsFrame:Clear()`,
}

// ═══════════════════════════════════════════════════════════
//  宏商品定义
// ═══════════════════════════════════════════════════════════

const DEMO_MACROS: Array<{
  slug: string
  title: string
  tier: 'regular' | 'premium'
  price: number
  durationDays: number
  autoRenewable: boolean
  isFeatured?: boolean
  featuredOrder?: number
  summary: string
  body: string
  codeKey: string
  classSlugs: string[]
  specSlugs: string[]
  versionLabels: string[]
  tags: string[]
  seo?: { seoTitle?: string; seoDescription?: string }
  demoVideoUrl?: string
}> = [
  {
    slug: 'warrior-arms-burst',
    title: '战士武器爆发大师宏',
    tier: 'premium',
    price: 100,
    durationDays: 30,
    autoRenewable: true,
    isFeatured: true,
    featuredOrder: 1,
    summary: '武器战士顶级爆发宏，30天授权，整合所有爆发技能与优先级判定。',
    body: '武器战士爆发大师级宏包，包含完整的技能优先级逻辑：致死打击 > 巨人打击 > 压制 > 猛击。自动判断鲁莽与天神下凡的最优开启时机，整合饰品自动使用。适用于团本首领战与大秘境冲层。',
    codeKey: 'warrior-arms',
    classSlugs: ['warrior'],
    specSlugs: ['warrior-arms'],
    versionLabels: ['11.0.5'],
    tags: ['爆发', '单体输出', '团本'],
    seo: { seoTitle: '战士武器爆发大师宏 — FlyMacro', seoDescription: '武器战士顶级爆发宏，整合致死打击、巨人打击优先级逻辑，自动开启天神下凡与鲁莽。' },
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    slug: 'warrior-fury-aoe',
    title: '战士狂怒AOE旋风宏',
    tier: 'regular',
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '狂怒战士AOE场景专用宏，永久有效，shift切换旋风斩。',
    body: '专为狂怒战士设计的AOE宏包。常态输出嗜血/怒击循环，按住Shift键自动切换为旋风斩AOE模式。整合奥丁之怒与巨龙怒吼，让你在5目标以上场景DPS拉满。',
    codeKey: 'warrior-fury',
    classSlugs: ['warrior'],
    specSlugs: ['warrior-fury'],
    versionLabels: ['11.0.5', '10.2.7'],
    tags: ['AOE', '群体输出'],
  },
  {
    slug: 'paladin-retri-rotation',
    title: '圣骑士惩戒一键循环宏',
    tier: 'premium',
    price: 100,
    durationDays: 0,
    autoRenewable: true,
    isFeatured: true,
    featuredOrder: 3,
    summary: '惩戒骑士大师级一键循环宏，永久授权，自动管理神圣能量。',
    body: '惩戒骑士完整输出循环宏，自动管理神圣能量（3豆裁决，5豆风暴）。整合复仇之怒爆发窗口，征伐叠加期间自动优化技能序列。附带完整的自保与辅助施法逻辑。',
    codeKey: 'paladin-retribution',
    classSlugs: ['paladin'],
    specSlugs: ['paladin-retribution'],
    versionLabels: ['11.0.5'],
    tags: ['一键循环', '单体输出', '自保'],
    seo: { seoTitle: '惩戒骑一键循环宏 — FlyMacro', seoDescription: '惩戒骑士完整输出循环宏，自动管理神圣能量，整合复仇之怒爆发窗口。' },
  },
  {
    slug: 'hunter-bm-pet',
    title: '猎人兽王宠物控制宏',
    tier: 'regular',
    price: 0,
    durationDays: 0,
    autoRenewable: true,
    summary: '兽王猎人宠物控制与输出整合宏，免费宏，适合新手入门。',
    body: '兽王猎人入门级宏包，整合宠物攻击/跟随/被动三态控制（Alt=跟随，Ctrl=被动）。常态输出杀戮命令循环，多重射击AOE切换。包含宠物治疗、复活等常用操作。',
    codeKey: 'hunter-beast-mastery',
    classSlugs: ['hunter'],
    specSlugs: ['hunter-beast-mastery'],
    versionLabels: ['11.0.5'],
    tags: ['宠物控制', '新手'],
  },
  {
    slug: 'hunter-mm-sniper',
    title: '猎人射击狙击大师宏',
    tier: 'premium',
    price: 100,
    durationDays: 7,
    autoRenewable: true,
    summary: '射击猎人大秘境狙击宏，7天短期授权，瞄准射击优先级优化。',
    body: '射击猎人大师级宏包，优化瞄准射击与急速射击的使用时机。百发百中期间自动调整循环，稳固射击只在需要回集中值时施放。附带束缚射击、驱散等控场技能整合。',
    codeKey: 'hunter-marksmanship',
    classSlugs: ['hunter'],
    specSlugs: ['hunter-marksmanship'],
    versionLabels: ['11.0.5'],
    tags: ['狙击', '单体输出', '控场'],
    demoVideoUrl: 'https://player.bilibili.com/player.html?bvid=BV1xxxxxxxxx',
  },
  {
    slug: 'rogue-sin-poison',
    title: '潜行者刺杀毒药管理宏',
    tier: 'regular',
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '刺杀贼毒药与DOT管理宏，永久有效，自动刷新割裂与锁喉。',
    body: '刺杀贼核心宏包，自动管理致命毒药与致伤毒药。DOT监控逻辑：割裂剩余时间<5秒时自动刷新，锁喉在消失后第一时间补。爆发期间宿敌+死亡印记自动对齐。',
    codeKey: 'rogue-assassination',
    classSlugs: ['rogue'],
    specSlugs: ['rogue-assassination'],
    versionLabels: ['11.0.5'],
    tags: ['DOT管理', '单体输出'],
  },
  {
    slug: 'priest-disc-advanced',
    title: '牧师戒律进阶团本宏',
    tier: 'premium',
    price: 100,
    durationDays: 30,
    autoRenewable: true,
    isFeatured: true,
    featuredOrder: 2,
    summary: '戒律牧师团本大师宏，30天授权，福音爆发与伤害转换完美对齐。',
    body: '戒律牧师进阶宏包，包含完整的赎罪时间轴管理。福音爆发期间自动优化苦修和盾的施放顺序。伤害转治疗逻辑：惩击/神圣之火自动对齐团队掉血窗口。附带完整的自保与位移技能。',
    codeKey: 'priest-discipline',
    classSlugs: ['priest'],
    specSlugs: ['priest-discipline'],
    versionLabels: ['11.0.5'],
    tags: ['团本', '治疗', '爆发'],
    seo: { seoTitle: '戒律牧师团本大师宏 — FlyMacro', seoDescription: '戒律牧师进阶宏包，福音爆发时间轴管理，伤害转治疗自动对齐团队掉血窗口。' },
  },
  {
    slug: 'priest-holy-starter',
    title: '牧师神圣入门治疗宏',
    tier: 'regular',
    price: 0,
    durationDays: 0,
    autoRenewable: true,
    summary: '神圣牧师新手治疗宏，免费宏，mouseover 智能施法。',
    body: '神圣牧师入门级宏包，全部治疗技能采用mouseover智能目标判定：鼠标指向友方则对该友方施法，否则对自己施法。包含圣言术系列的最优使用逻辑，适合团队副本与五人本。',
    codeKey: 'priest-holy',
    classSlugs: ['priest'],
    specSlugs: ['priest-holy'],
    versionLabels: ['11.0.5', '10.2.7'],
    tags: ['治疗', '新手', 'mouseover'],
  },
  {
    slug: 'shaman-ele-totem',
    title: '萨满元素图腾爆发宏',
    tier: 'regular',
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '元素萨满图腾管理与爆发宏，永久有效，火元素/风暴元素自动召唤。',
    body: '元素萨满图腾宏包，整合火元素与风暴元素的召唤逻辑（根据天赋自动判断）。升腾期间自动优化熔岩爆裂优先级，大地震击在元素过载后第一时间释放。附带治疗之涌与大地之盾的紧急自保。',
    codeKey: 'shaman-elemental',
    classSlugs: ['shaman'],
    specSlugs: ['shaman-elemental'],
    versionLabels: ['11.0.5'],
    tags: ['图腾', '爆发', '自保'],
  },
  {
    slug: 'mage-fire-combustion',
    title: '法师火焰燃烧爆发宏',
    tier: 'premium',
    price: 100,
    durationDays: 0,
    autoRenewable: true,
    summary: '火法燃烧爆发大师宏，永久授权，炎爆术连锁自动判定。',
    body: '火焰法师大师级宏包，燃烧期间自动优化炎爆术与小括号判定。流星与燃烧完美对齐，火冲只在热力迸发时施放。附带龙息术、冰霜新星等控场技能，以及闪现、冰箱等完整自保链。',
    codeKey: 'mage-fire',
    classSlugs: ['mage'],
    specSlugs: ['mage-fire'],
    versionLabels: ['11.0.5'],
    tags: ['爆发', '炎爆术', '自保'],
    seo: { seoTitle: '火法燃烧爆发大师宏 — FlyMacro', seoDescription: '火焰法师大师级宏包，燃烧期间自动优化炎爆术与小括号判定，流星与燃烧完美对齐。' },
  },
  {
    slug: 'mage-frost-control',
    title: '法师冰霜控场大师宏',
    tier: 'regular',
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '冰法控场与输出整合宏，永久有效，变形术智能指向。',
    body: '冰霜法师控场宏包，整合所有控场技能：变形术、深度冻结、冰霜之环、冰霜新星。输出循环自动管理深冬之寒层数，冰枪术在深冬之寒时优先施放。附带闪现、冰箱、隐形术的完整逃生链。',
    codeKey: 'mage-frost',
    classSlugs: ['mage'],
    specSlugs: ['mage-frost'],
    versionLabels: ['11.0.5', '10.2.7'],
    tags: ['控场', 'PvP', '自保'],
  },
  {
    slug: 'warlock-destro-chaos',
    title: '术士毁灭混乱箭宏',
    tier: 'premium',
    price: 100,
    durationDays: 7,
    autoRenewable: true,
    summary: '毁灭术士混乱箭爆发宏，7天短期授权，大灾变与地狱火完美对齐。',
    body: '毁灭术士大师级宏包，自动管理燃烧碎片与混乱箭的施放节奏。大灾变、召唤地狱火与黑暗灵魂三爆发自动对齐。浩劫期间自动复制混乱箭到副目标，最大化双目标输出。',
    codeKey: 'warlock-destruction',
    classSlugs: ['warlock'],
    specSlugs: ['warlock-destruction'],
    versionLabels: ['11.0.5'],
    tags: ['爆发', '双目标', '混乱箭'],
    demoVideoUrl: 'https://www.bilibili.com/video/BV1xxxxxxxxx',
  },
  {
    slug: 'monk-ww-combo',
    title: '武僧踏风连招大师宏',
    tier: 'regular',
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '踏风武僧连招整合宏，永久有效，幻灭踢-旭日-怒雷破完美衔接。',
    body: '踏风武僧连招宏包，整合核心输出循环：幻灭踢 > 旭日东升踢 > 怒雷破 > 升龙霸。真气管理逻辑：真气不足时自动填充猛虎掌。附带分筋错骨、扫堂腿、切喉手的完整控场链，以及业报之触与壮胆酒的自保。',
    codeKey: 'monk-windwalker',
    classSlugs: ['monk'],
    specSlugs: ['monk-windwalker'],
    versionLabels: ['11.0.5'],
    tags: ['连招', '单体输出', '控场'],
  },
  {
    slug: 'druid-balance-eclipse',
    title: '德鲁伊平衡日月蚀宏',
    tier: 'premium',
    price: 100,
    durationDays: 30,
    autoRenewable: true,
    summary: '平衡德鲁伊日月蚀循环宏，30天授权，超凡之盟自动对齐星辰坠落。',
    body: '平衡德鲁伊大师级宏包，自动管理日月蚀循环：进蚀后自动优化愤怒/星火术施放。超凡之盟期间自动对齐星辰坠落与艾露恩之怒。DOT管理：月火术与阳炎术在剩余时间<30%时自动刷新。附带乌索尔旋风与迎头痛击的控场。',
    codeKey: 'druid-balance',
    classSlugs: ['druid'],
    specSlugs: ['druid-balance'],
    versionLabels: ['11.0.5'],
    tags: ['日月蚀', 'DOT管理', '爆发'],
    seo: { seoTitle: '平衡德鲁伊日月蚀循环宏 — FlyMacro', seoDescription: '平衡德鲁伊大师级宏包，自动管理日月蚀循环，超凡之盟对齐星辰坠落与艾露恩之怒。' },
  },
  {
    slug: 'demonhunter-havoc-eye',
    title: '恶魔猎手浩劫眼棱宏',
    tier: 'regular',
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '浩劫DH眼棱爆发与位移整合宏，永久有效，恶魔变形自动对齐。',
    body: '浩劫恶魔猎手核心宏包，眼棱期间自动衔接刃舞与死亡横扫。恶魔变形自动对齐眼棱CD，最大化变身期间的混乱打击次数。附带禁锢、瓦解、悲苦咒符的控场链，以及复仇回避与疾影的完整自保。',
    codeKey: 'demonhunter-havoc',
    classSlugs: ['demonhunter'],
    specSlugs: ['demonhunter-havoc'],
    versionLabels: ['11.0.5'],
    tags: ['眼棱', '爆发', '位移'],
  },
  {
    slug: 'deathknight-blood-tank',
    title: '死亡骑士鲜血坦克宏',
    tier: 'premium',
    price: 100,
    durationDays: 0,
    autoRenewable: true,
    summary: '鲜血DK坦克生存宏，永久授权，灵界打击与骨髓分裂智能判定。',
    body: '鲜血死亡骑士坦克宏包，自动管理符文与符文能量：骨盾层数<5时优先骨髓分裂，符文能量>80时自动灵界打击。吸血鬼之血与冰封之韧在血量低于50%时自动开启。附带死亡之握、黑暗命令的完整仇恨链，以及反魔法护罩与亡者领域的团队保护。',
    codeKey: 'deathknight-blood',
    classSlugs: ['deathknight'],
    specSlugs: ['deathknight-blood'],
    versionLabels: ['11.0.5'],
    tags: ['坦克', '生存', '仇恨'],
    seo: { seoTitle: '鲜血DK坦克生存宏 — FlyMacro', seoDescription: '鲜血死亡骑士坦克宏包，骨盾与灵界打击智能判定，吸血鬼之血自动开启。' },
  },
  {
    slug: 'evoker-deva-breath',
    title: '唤魔师湮灭吐息宏',
    tier: 'regular',
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '湮灭唤魔师吐息与裂解整合宏，永久有效，深呼吸爆发自动对齐。',
    body: '湮灭唤魔师核心宏包，整合活化烈焰与裂解的输出循环。深呼吸期间自动优化碧蓝打击与永恒吐息的施放顺序。狂龙之怒开启时自动对齐焚身与裂解爆发。附带梦游、镇压、击飞的控场链，以及回响与逆转的治疗支援。',
    codeKey: 'evoker-devastation',
    classSlugs: ['evoker'],
    specSlugs: ['evoker-devastation'],
    versionLabels: ['11.0.5'],
    tags: ['吐息', '爆发', '支援'],
  },
]

// ═══════════════════════════════════════════════════════════
//  测试用户
// ═══════════════════════════════════════════════════════════

const TEST_USERS = [
  { email: 'admin@flymacro.local',    password: 'Admin123456!', name: '超级管理员', role: 'super-admin' as const, credits: 9999 },
  { email: 'operator@flymacro.local', password: 'Op123456!',    name: '运营专员',   role: 'operator'    as const, credits: 500 },
  { email: 'support@flymacro.local',  password: 'Sup123456!',   name: '客服小美',   role: 'support'     as const, credits: 200 },
  { email: 'rich@flymacro.local',     password: 'Rich123456!',  name: '土豪玩家',   role: 'user'        as const, credits: 500 },
  { email: 'newbie@flymacro.local',   password: 'Newb123456!',  name: '萌新小白',   role: 'user'        as const, credits: 20 },
  { email: 'broke@flymacro.local',    password: 'Broke123456!', name: '穷鬼阿强',   role: 'user'        as const, credits: 0 },
]

// ═══════════════════════════════════════════════════════════
//  文章
// ═══════════════════════════════════════════════════════════

const ARTICLES = [
  {
    title: 'FlyMacro 正式上线！全职业宏库开放',
    slug: 'launch-announcement',
    summary: '历经三个月开发，FlyMacro 魔兽世界宏库正式对外开放。涵盖13个职业38个专精，从入门到精通一站式解决。',
    category: 'announcement' as const,
    pinned: true,
    body: '亲爱的冒险者们，\n\nFlyMacro 宏库今日正式上线！\n\n我们汇聚了全职业38个专精的实战宏包，每一套宏都经过200+小时副本与竞技场实测。无论你是刚满级的新手，还是冲击史诗钥石极限的大神，都能在这里找到适合自己的宏。\n\n首批上线特色：\n- 13个职业全覆盖\n- 普通宏5积分兑换\n- 高级宏100积分，30天专家级支持\n- 所有宏基于暴雪官方API，100%安全合规\n\n立即访问 /macros 开始探索！',
  },
  {
    title: '如何写出高效的魔兽世界宏：从入门到精通',
    slug: 'macro-guide-advanced',
    summary: '深入解析宏命令的工作原理，教你如何写出响应延迟低于16ms的高效宏。',
    category: 'blog' as const,
    pinned: false,
    body: '魔兽世界宏命令看似简单，但要写出真正高效的宏却有不少门道。\n\n## 1. 条件判断的优先级\n\n/cast 命令的条件判断是从左到右执行的。把最常用、最严格的条件放在左边，可以减少不必要的判断开销。\n\n## 2. 避免冗余的 /castsequence\n\n序列宏在复杂场景下容易卡死。推荐使用条件判断 + mod 键的组合，而不是固定的序列。\n\n## 3. UIErrorsFrame:Clear() 的重要性\n\n这个脚本命令可以清除"技能还没准备好"的刷屏提示，让你的战斗信息更加清晰。\n\n## 4. @mouseover 是治疗的灵魂\n\n对于治疗职业，mouseover 目标判定比点击团队框架快200-300ms，这在高压治疗场景下是生与死的差距。',
  },
  {
    title: 'v1.2.0 更新日志：新增恶魔猎手与唤魔师宏包',
    slug: 'changelog-v1-2-0',
    summary: '本次更新新增2个职业6个专精的宏包，优化了筛选系统，支持按标签搜索。',
    category: 'changelog' as const,
    pinned: false,
    body: '## v1.2.0 (2024-11-15)\n\n### 新增\n- 恶魔猎手浩劫/复仇双专精宏包\n- 唤魔师湮灭/恒护/增辉三专精宏包\n- 标签系统：支持单体输出、AOE、爆发、自保等标签筛选\n- 演示视频嵌入：支持YouTube和B站视频\n\n### 优化\n- 首页精选宏包改为运营可控排序\n- 详情页新增SEO结构化数据\n- 后台列表显示优化，财务字段改为只读',
  },
  {
    title: 'PvP 宏与 PvE 宏的核心差异',
    slug: 'pvp-vs-pve-macros',
    summary: '为什么同一个职业需要两套不同的宏？深入分析PvP与PvE场景下宏设计的核心差异。',
    category: 'blog' as const,
    pinned: false,
    body: '很多新手玩家会问：为什么我不能用同一套宏打副本和打竞技场？\n\n## 目标优先级不同\n\nPvE中，你的目标通常是固定的Boss或小怪。PvP中，你需要在0.5秒内切换到正确的敌方玩家。因此PvP宏需要大量的 focus 和 arena1/2/3 目标判定。\n\n## 技能使用时机不同\n\nPvE宏追求最大化DPS/HPS，技能CD好了就用。PvP宏则需要保留关键技能（如控制、自保）到关键时刻。\n\n## 自保链的长度\n\nPvE中的自保通常是"血量低就开减伤"。PvP中的自保是一个复杂的链式反应：预判对方爆发 → 提前开减伤 → 被控后交章 → 交位移拉开 → 最后手段交无敌/冰箱。',
  },
]

// ═══════════════════════════════════════════════════════════
//  页面
// ═══════════════════════════════════════════════════════════

const PAGES = [
  {
    title: '关于 FlyMacro',
    slug: 'about',
    body: 'FlyMacro 是一个专注于魔兽世界宏命令与插件分享的平台。\n\n我们的使命是让每一位冒险者都能获得最佳的战斗体验。所有宏均基于暴雪官方API开发，100%安全合规。',
  },
  {
    title: '隐私政策',
    slug: 'privacy',
    body: 'FlyMacro 重视用户隐私保护。\n\n## 数据收集\n\n我们只收集必要的账户信息（邮箱、昵称）和交易记录。宏代码内容仅在用户兑换后可见。\n\n## Cookie 使用\n\n我们使用必要的 Cookie 来维持会话状态，不使用第三方跟踪 Cookie。',
  },
  {
    title: '服务条款',
    slug: 'terms',
    body: '使用 FlyMacro 即表示您同意以下条款：\n\n1. 所有宏代码仅供个人游戏使用，禁止转售或二次分发。\n2. 禁止使用任何自动化工具批量爬取本站内容。\n3. 用户生成内容（评论、反馈）需遵守社区规范。',
  },
]

// ═══════════════════════════════════════════════════════════
//  积分包
// ═══════════════════════════════════════════════════════════

const CREDIT_PACKAGES = [
  { label: '充值 10 元得 12 积分',      amount: 10,  originalAmount: 12,  creditsGranted: 12,  dodoProductId: 'prod_10cny',  currency: 'CNY' as const, enabled: true, sort: 1, discountLabel: null, badge: 'none' },
  { label: '充值 50 元得 60 积分',      amount: 50,  originalAmount: 60,  creditsGranted: 60,  dodoProductId: 'prod_50cny',  currency: 'CNY' as const, enabled: true, sort: 2, discountLabel: '限时特惠', badge: 'hot' },
  { label: '充值 100 元得 125 积分',    amount: 100, originalAmount: 120, creditsGranted: 125, dodoProductId: 'prod_100cny', currency: 'CNY' as const, enabled: true, sort: 3, discountLabel: '最超值', badge: 'recommended' },
  { label: '充值 300 元得 400 积分',    amount: 300, originalAmount: 400, creditsGranted: 400, dodoProductId: 'prod_300cny', currency: 'CNY' as const, enabled: true, sort: 4, discountLabel: 'VIP专享', badge: 'recommended' },
]

// ═══════════════════════════════════════════════════════════
//  指南
// ═══════════════════════════════════════════════════════════

const GUIDES = [
  {
    title: '宏命令基础入门',
    slug: 'macro-basics',
    summary: '从零开始学习魔兽世界宏命令，包括基本语法、条件判断和常用技巧。',
    weight: 1,
    body: '## 什么是宏命令？\n\n宏命令是魔兽世界内置的脚本系统，允许玩家将多个命令绑定到一个按键上。\n\n## 基本语法\n\n```\n#showtooltip 技能名称\n/cast [条件] 技能名称\n/use [条件] 物品名称\n/script 脚本代码\n```\n\n## 常用条件\n- `@mouseover` — 对鼠标指向目标施法\n- `[@player]` — 对自己施法\n- `[mod:shift]` — 按住Shift键时\n- `[combat]` — 战斗状态中\n- `[nostealth]` — 不在潜行状态时',
  },
  {
    title: '如何购买和兑换宏',
    slug: 'how-to-purchase',
    summary: '详细的购买流程说明：从注册账户到积分充值，再到宏兑换的完整指南。',
    weight: 2,
    body: '## 注册账户\n\n点击右上角「注册」按钮，填写邮箱和密码即可完成注册。新用户自动获得20积分。\n\n## 充值积分\n\n进入「我的账户」→「充值积分」，选择适合的积分包完成支付。\n\n## 兑换宏\n\n1. 浏览宏库，找到感兴趣的宏\n2. 点击「兑换」按钮\n3. 确认扣除积分\n4. 刷新页面即可查看完整宏代码',
  },
]

// ═══════════════════════════════════════════════════════════
//  工具函数
// ═══════════════════════════════════════════════════════════

function lexicalBody(text: string): any {
  const paragraphs = text.split('\n\n').map((p) => ({
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      { mode: 'normal', text: p, type: 'text', style: '', detail: 0, format: 0, version: 1 },
    ],
  }))
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs,
    },
  }
}

async function upsertBySlug(payload: any, collection: string, slug: string, data: any) {
  const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (found.docs.length > 0) {
    return payload.update({ collection, id: found.docs[0].id, data })
  }
  return payload.create({ collection, data })
}

async function upsertVersion(payload: any, label: string, data: any) {
  const found = await payload.find({ collection: 'versions', where: { label: { equals: label } }, limit: 1, depth: 0 })
  if (found.docs.length > 0) {
    return payload.update({ collection: 'versions', id: found.docs[0].id, data })
  }
  return payload.create({ collection: 'versions', data })
}

async function upsertByEmail(payload: any, email: string, data: any) {
  const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0 })
  if (found.docs.length > 0) {
    return payload.update({ collection: 'users', id: found.docs[0].id, data })
  }
  return payload.create({ collection: 'users', data })
}

// ═══════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════

async function main() {
  const payload = await getPayload({ config })
  console.log('[seed-full] starting...')

  // ── 1. 引用数据 ────────────────────────────────────────
  for (const c of CLASSES) {
    await upsertBySlug(payload, 'classes', c.slug, c)
  }
  console.log(`[seed-full] upserted ${CLASSES.length} classes`)

  const classIdBySlug = new Map<string, string | number>()
  const allClasses = await payload.find({ collection: 'classes', limit: 100, depth: 0 })
  allClasses.docs.forEach((c: any) => classIdBySlug.set(c.slug, c.id))

  for (const s of SPECS) {
    const classId = classIdBySlug.get(s.classSlug)
    if (!classId) { console.warn(`[seed-full] missing class for spec ${s.slug}`); continue }
    await upsertBySlug(payload, 'specs', s.slug, {
      slug: s.slug, nameZh: s.nameZh, nameEn: s.nameEn,
      class: classId, role: s.role, sort: s.sort,
    })
  }
  console.log(`[seed-full] upserted ${SPECS.length} specs`)

  for (const v of VERSIONS) {
    await upsertVersion(payload, v.label, v)
  }
  console.log(`[seed-full] upserted ${VERSIONS.length} versions`)

  // ── 2. 测试用户 ────────────────────────────────────────
  for (const u of TEST_USERS) {
    const existing = await payload.find({ collection: 'users', where: { email: { equals: u.email } }, limit: 1, depth: 0 })
    if (existing.docs.length > 0) {
      await payload.update({ collection: 'users', id: existing.docs[0].id, data: { credits: u.credits, _verified: true } })
      console.log(`[seed-full] updated user: ${u.email} (credits=${u.credits})`)
    } else {
      await payload.create({
        collection: 'users',
        data: { email: u.email, password: u.password, name: u.name, role: u.role, credits: u.credits, _verified: true },
      })
      console.log(`[seed-full] created user: ${u.email} / ${u.password} (${u.role}, ${u.credits} credits)`)
    }
  }

  // ── 3. 宏商品 ──────────────────────────────────────────
  const specIdBySlug = new Map<string, string | number>()
  const allSpecs = await payload.find({ collection: 'specs', limit: 100, depth: 0 })
  allSpecs.docs.forEach((s: any) => specIdBySlug.set(s.slug, s.id))

  const versionIdByLabel = new Map<string, string | number>()
  const allVersions = await payload.find({ collection: 'versions', limit: 100, depth: 0 })
  allVersions.docs.forEach((v: any) => versionIdByLabel.set(v.label, v.id))

  let createdMacros = 0
  for (const m of DEMO_MACROS) {
    const existing = await payload.find({ collection: 'macros', where: { slug: { equals: m.slug } }, limit: 1, depth: 0 })
    if (existing.docs.length > 0) {
      console.log(`[seed-full] macro "${m.slug}" already exists, skipping`)
      continue
    }

    const classIds = m.classSlugs.map((s) => classIdBySlug.get(s)).filter(Boolean) as (string | number)[]
    const specIds = m.specSlugs.map((s) => specIdBySlug.get(s)).filter(Boolean) as (string | number)[]
    const versionIds = m.versionLabels.map((l) => versionIdByLabel.get(l)).filter(Boolean) as (string | number)[]
    const codeContent = MACRO_CODES[m.codeKey]
    const lines = codeContent.split('\n').length

    await payload.create({
      collection: 'macros',
      data: {
        title: m.title,
        slug: m.slug,
        tier: m.tier,
        price: m.price,
        durationDays: m.durationDays,
        autoRenewable: m.autoRenewable,
        isFeatured: m.isFeatured ?? false,
        featuredOrder: m.featuredOrder ?? null,
        summary: m.summary,
        body: lexicalBody(m.body),
        codeContent,
        classes: classIds,
        specs: specIds,
        versions: versionIds,
        tags: m.tags.map((t) => ({ value: t })),
        seo: m.seo ?? null,
        demoVideoUrl: m.demoVideoUrl ?? null,
        publishedAt: new Date().toISOString(),
        _status: 'published',
      } as any,
    })
    console.log(`[seed-full] created macro: ${m.title} (${m.tier}, ${m.price} credits, ${lines} lines)`)
    createdMacros++
  }
  console.log(`[seed-full] created ${createdMacros} new macros`)

  // ── 4. 文章 ────────────────────────────────────────────
  for (const a of ARTICLES) {
    const existing = await payload.find({ collection: 'articles', where: { slug: { equals: a.slug } }, limit: 1, depth: 0 })
    if (existing.docs.length > 0) {
      console.log(`[seed-full] article "${a.slug}" already exists, skipping`)
      continue
    }
    await payload.create({
      collection: 'articles',
      data: {
        title: a.title,
        slug: a.slug,
        summary: a.summary,
        category: a.category,
        pinned: a.pinned,
        body: lexicalBody(a.body),
        publishedAt: new Date().toISOString(),
        _status: 'published',
      } as any,
    })
    console.log(`[seed-full] created article: ${a.title}`)
  }

  // ── 5. 页面 ────────────────────────────────────────────
  for (const p of PAGES) {
    const existing = await payload.find({ collection: 'pages', where: { slug: { equals: p.slug } }, limit: 1, depth: 0 })
    if (existing.docs.length > 0) {
      console.log(`[seed-full] page "${p.slug}" already exists, skipping`)
      continue
    }
    await payload.create({
      collection: 'pages',
      data: {
        title: p.title,
        slug: p.slug,
        body: lexicalBody(p.body),
        publishedAt: new Date().toISOString(),
        _status: 'published',
      } as any,
    })
    console.log(`[seed-full] created page: ${p.title}`)
  }

  // ── 6. 积分包 ──────────────────────────────────────────
  for (const cp of CREDIT_PACKAGES) {
    const existing = await payload.find({
      collection: 'credit-packages',
      where: { dodoProductId: { equals: cp.dodoProductId } },
      limit: 1, depth: 0,
    })
    if (existing.docs.length > 0) {
      console.log(`[seed-full] credit-package "${cp.dodoProductId}" already exists, skipping`)
      continue
    }
    await payload.create({ collection: 'credit-packages', data: cp as any })
    console.log(`[seed-full] created credit-package: ${cp.label}`)
  }

  // ── 7. 指南 ────────────────────────────────────────────
  for (const g of GUIDES) {
    const existing = await payload.find({ collection: 'guides', where: { slug: { equals: g.slug } }, limit: 1, depth: 0 })
    if (existing.docs.length > 0) {
      console.log(`[seed-full] guide "${g.slug}" already exists, skipping`)
      continue
    }
    await payload.create({
      collection: 'guides',
      data: {
        title: g.title,
        slug: g.slug,
        summary: g.summary,
        weight: g.weight,
        body: lexicalBody(g.body),
        publishedAt: new Date().toISOString(),
        _status: 'published',
      } as any,
    })
    console.log(`[seed-full] created guide: ${g.title}`)
  }

  // ── 8. 创建兑换记录 ────────────────────────────────────
  const richUser = await payload.find({ collection: 'users', where: { email: { equals: 'rich@flymacro.local' } }, limit: 1, depth: 0 })
  const newbieUser = await payload.find({ collection: 'users', where: { email: { equals: 'newbie@flymacro.local' } }, limit: 1, depth: 0 })

  if (richUser.docs.length > 0) {
    const richId = richUser.docs[0].id
    const macrosToExchange = ['warrior-arms-burst', 'priest-disc-advanced', 'mage-fire-combustion']
    for (const macroSlug of macrosToExchange) {
      const macroRes = await payload.find({ collection: 'macros', where: { slug: { equals: macroSlug } }, limit: 1, depth: 0 })
      if (macroRes.docs.length === 0) continue
      const macro = macroRes.docs[0] as any

      const existingEx = await payload.find({
        collection: 'macro-exchanges',
        where: {
          and: [
            { user: { equals: richId } },
            { macro: { equals: macro.id } },
          ],
        },
        limit: 1, depth: 0,
      })
      if (existingEx.docs.length > 0) continue

      await payload.create({
        collection: 'macro-exchanges',
        data: {
          user: richId,
          macro: macro.id,
          creditsSpent: macro.price,
          grantedAt: new Date().toISOString(),
          expiresAt: macro.durationDays > 0
            ? new Date(Date.now() + macro.durationDays * 86400000).toISOString()
            : null,
        } as any,
      })
      console.log(`[seed-full] created exchange: rich -> ${macro.title}`)
    }
  }

  if (newbieUser.docs.length > 0) {
    const newbieId = newbieUser.docs[0].id
    const freeMacros = ['hunter-bm-pet', 'priest-holy-starter']
    for (const macroSlug of freeMacros) {
      const macroRes = await payload.find({ collection: 'macros', where: { slug: { equals: macroSlug } }, limit: 1, depth: 0 })
      if (macroRes.docs.length === 0) continue
      const macro = macroRes.docs[0] as any

      const existingEx = await payload.find({
        collection: 'macro-exchanges',
        where: {
          and: [
            { user: { equals: newbieId } },
            { macro: { equals: macro.id } },
          ],
        },
        limit: 1, depth: 0,
      })
      if (existingEx.docs.length > 0) continue

      await payload.create({
        collection: 'macro-exchanges',
        data: {
          user: newbieId,
          macro: macro.id,
          creditsSpent: macro.price,
          grantedAt: new Date().toISOString(),
          expiresAt: null,
        } as any,
      })
      console.log(`[seed-full] created exchange: newbie -> ${macro.title}`)
    }
  }

  // ── 9. 创建工单 ────────────────────────────────────────
  const testUsers = await payload.find({ collection: 'users', limit: 10, depth: 0 })
  const normalUser = testUsers.docs.find((u: any) => u.role === 'user')
  if (normalUser) {
    const existingTicket = await payload.find({
      collection: 'tickets',
      where: { subject: { equals: '兑换的宏代码显示不完整' } },
      limit: 1, depth: 0,
    })
    if (existingTicket.docs.length === 0) {
      const ticket = await payload.create({
        collection: 'tickets',
        data: {
          user: normalUser.id,
          subject: '兑换的宏代码显示不完整',
          description: '我兑换了战士武器爆发宏，但是代码区域只显示了前10行，后面都是空的。请帮忙检查一下。',
          status: 'open',
          priority: 'medium',
        } as any,
      })
      console.log(`[seed-full] created ticket: ${(ticket as any).subject}`)

      // 用户回复
      await payload.create({
        collection: 'ticket-messages',
        data: {
          ticket: (ticket as any).id,
          sender: normalUser.id,
          body: '补充一下，我用的是Chrome浏览器，版本是120。刷新页面也没有用。',
          isInternalNote: false,
        } as any,
      })

      // 客服内部备注
      const supportUser = testUsers.docs.find((u: any) => u.role === 'support')
      if (supportUser) {
        await payload.create({
          collection: 'ticket-messages',
          data: {
            ticket: (ticket as any).id,
            sender: supportUser.id,
            body: '排查记录：用户账户正常，兑换记录存在，宏代码字段有内容。可能是前端渲染问题，已转交技术团队。',
            isInternalNote: true,
          } as any,
        })
      }
    }
  }

  // ── 10. 初始化站点设置 ──────────────────────────────────
  const existingSettings = await payload.findGlobal({ slug: 'site-settings' })
  if (!existingSettings || Object.keys(existingSettings).length === 0) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        creditPage: {
          title: '充值积分',
          subtitle: '登录后即可充值积分，兑换宏使用权。',
          promoEnabled: false,
          promoBanner: '',
          noticeEnabled: true,
          notice: null,
        },
      } as any,
    })
    console.log('[seed-full] initialized site-settings with defaults')
  } else {
    console.log('[seed-full] site-settings already exists, skipping')
  }

  console.log('[seed-full] all done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed-full] failed:', err)
  process.exit(1)
})
