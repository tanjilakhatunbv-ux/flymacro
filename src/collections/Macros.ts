import type { CollectionConfig, FieldHook, Validate } from 'payload'
import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { isOperatorOrAbove, publishedOrStaff } from '../lib/access'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')

const ensureSlug: FieldHook = ({ value, data }) => {
  if (value) return value
  if (data?.title) return slugify(String(data.title))
  return value
}

const stripCodeForUnpurchased: FieldHook = async ({ value, req, data }) => {
  if (req.user && (req.user.role === 'super-admin' || req.user.role === 'operator' || req.user.role === 'support')) {
    return value
  }
  if (!req.user) return null
  try {
    const found = await req.payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { user: { equals: req.user.id } },
          { macro: { equals: data?.id } },
          {
            or: [
              { expiresAt: { exists: false } },
              { expiresAt: { greater_than_equal: new Date().toISOString() } },
            ],
          },
        ],
      },
      limit: 1,
      depth: 0,
    })
    if (found.docs.length > 0) return value
  } catch (_) {
    /* ignore */
  }
  return null
}

const validateVideoUrl: Validate<string | null | undefined> = (value) => {
  if (!value) return true
  try {
    const u = new URL(value)
    if (!/^https?:$/.test(u.protocol)) return '仅支持 http/https 链接'
    return true
  } catch {
    return '请输入合法的 URL'
  }
}

const isPaid = (sib: unknown) => Number((sib as { price?: number })?.price ?? 0) > 0
const isPaidWithDuration = (sib: unknown) => {
  const s = sib as { price?: number; durationDays?: number }
  return Number(s?.price ?? 0) > 0 && Number(s?.durationDays ?? 0) > 0
}

export const Macros: CollectionConfig = {
  slug: 'macros',
  labels: { singular: '宏', plural: '宏' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tier', 'price', 'isFeatured', 'classes', 'publishedAt', '_status'],
    group: '宏库',
    description: '魔兽世界宏代码商品。普通宏建议 5 积分、高级宏 100 积分；代码字段对未兑换用户自动隐藏。',
    listSearchableFields: ['title', 'slug', 'summary'],
    preview: (doc) => {
      const slug = (doc as { slug?: string })?.slug
      return slug ? `/macros/${slug}` : null
    },
  },
  access: {
    read: publishedOrStaff,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isOperatorOrAbove,
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
    },
    maxPerDoc: 20,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: '名称' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [ensureSlug] },
      admin: { position: 'sidebar', description: '留空将根据名称自动生成，影响前台 URL' },
    },
    {
      name: 'tier',
      type: 'select',
      required: true,
      defaultValue: 'regular',
      options: [
        { label: '普通宏', value: 'regular' },
        { label: '高级宏', value: 'premium' },
      ],
      admin: { position: 'sidebar', description: '普通宏建议 5 积分，高级宏建议 100 积分' },
    },
    {
      name: 'price',
      type: 'number',
      required: false,
      defaultValue: 0,
      label: '兑换积分',
      min: 0,
      admin: { position: 'sidebar', description: '0 = 免费宏（用户无需兑换即可查看代码）' },
    },
    {
      name: 'durationDays',
      type: 'number',
      required: false,
      defaultValue: 0,
      label: '有效期（天）',
      min: 0,
      admin: {
        position: 'sidebar',
        description: '0 = 永久有效。仅付费宏需要',
        condition: (_, sib) => isPaid(sib),
      },
    },
    {
      name: 'autoRenewable',
      type: 'checkbox',
      defaultValue: true,
      label: '支持自动续费',
      admin: {
        position: 'sidebar',
        description: '仅在付费且有期限时有意义',
        condition: (_, sib) => isPaidWithDuration(sib),
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      label: '首页精选',
      admin: { position: 'sidebar', description: '勾选后在首页"精选宏包"区显示' },
    },
    {
      name: 'featuredOrder',
      type: 'number',
      label: '精选排序',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description: '数值越小越靠前',
        condition: (_, sib) => Boolean((sib as { isFeatured?: boolean })?.isFeatured),
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      label: '简介（列表卡片显示）',
      maxLength: 240,
      admin: { description: '一句话描述用途，会在列表卡片、SEO meta、社交分享中使用' },
    },
    {
      name: 'previewImg',
      type: 'upload',
      relationTo: 'media',
      label: '预览图',
      admin: { description: '建议尺寸 1600x900，会自动生成卡片/封面/OG 图多个尺寸' },
    },
    {
      name: 'demoVideoUrl',
      type: 'text',
      label: '演示视频链接（可选）',
      admin: { description: '支持 YouTube / Bilibili / 直链 MP4，留空则不显示' },
      validate: validateVideoUrl,
    },
    {
      name: 'classes',
      type: 'relationship',
      relationTo: 'classes',
      hasMany: true,
      label: '适用职业',
    },
    {
      name: 'specs',
      type: 'relationship',
      relationTo: 'specs',
      hasMany: true,
      label: '适用专精',
    },
    {
      name: 'versions',
      type: 'relationship',
      relationTo: 'versions',
      hasMany: true,
      label: '兼容版本',
    },
    {
      name: 'tags',
      type: 'array',
      label: '标签',
      labels: { singular: '标签', plural: '标签' },
      admin: {
        description: '便于前台筛选和聚合，例如：单体输出、群体输出、保命、控场、自我治疗',
      },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'body',
      type: 'richText',
      label: '详细介绍',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'codeContent',
      type: 'code',
      label: '宏代码（兑换后才可见）',
      admin: {
        language: 'lua',
        description: '此字段对未兑换用户自动返回 null。新建草稿时也会被隐藏，正常发布后由购买者自动可见。',
      },
      hooks: { afterRead: [stripCodeForUnpurchased] },
    },
    {
      type: 'group',
      name: 'seo',
      label: 'SEO 设置',
      admin: { description: '搜索引擎与社交分享时使用，留空则回落到名称/简介/预览图' },
      fields: [
        { name: 'seoTitle', type: 'text', label: 'SEO 标题', admin: { description: '默认使用宏名称 + 站名' } },
        { name: 'seoDescription', type: 'textarea', maxLength: 160, label: 'SEO 描述', admin: { description: '默认使用简介' } },
        { name: 'ogImage', type: 'upload', relationTo: 'media', label: '社交分享封面', admin: { description: '建议 1200x630，留空则使用预览图' } },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: '发布时间',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  timestamps: true,
}
