import type { CollectionConfig, FieldHook } from 'payload'
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
  if (data?.type === 'free') return value
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

export const Macros: CollectionConfig = {
  slug: 'macros',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'classes', 'publishedAt', '_status'],
    group: '宏库',
    listSearchableFields: ['title', 'slug', 'summary'],
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
    { name: 'title', type: 'text', required: true, label: '标题' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [ensureSlug] },
      admin: { position: 'sidebar', description: '留空将根据标题自动生成' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'free',
      options: [
        { label: '免费', value: 'free' },
        { label: '付费', value: 'premium' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'summary',
      type: 'textarea',
      label: '简介（列表卡片显示）',
      maxLength: 240,
    },
    {
      name: 'previewImg',
      type: 'upload',
      relationTo: 'media',
      label: '预览图',
    },
    { name: 'demoVideoUrl', type: 'text', label: '演示视频链接（可选）' },
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
      fields: [{ name: 'value', type: 'text' }],
    },
    {
      name: 'body',
      type: 'richText',
      label: '正文',
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
      label: '宏代码（已购买/免费才可见）',
      admin: {
        language: 'lua',
        description: '此字段对未购买的付费宏将自动返回 null',
      },
      hooks: { afterRead: [stripCodeForUnpurchased] },
    },
    {
      name: 'models',
      type: 'array',
      label: '型号（仅付费宏）',
      labels: { singular: '型号', plural: '型号' },
      admin: {
        condition: (data) => data?.type === 'premium',
        description: '积分兑换配置：价格=积分、有效期、是否支持自动续费',
      },
      fields: [
        { name: 'name', type: 'text', required: true, label: '型号名（基础版/进阶版/大师版）' },
        {
          name: 'price',
          type: 'number',
          required: true,
          label: '积分价格',
          min: 0,
        },
        {
          name: 'tier',
          type: 'select',
          required: true,
          defaultValue: 'regular',
          label: '档次',
          options: [
            { label: '常规宏', value: 'regular' },
            { label: '高级宏', value: 'premium' },
          ],
        },
        {
          name: 'durationDays',
          type: 'number',
          required: true,
          defaultValue: 0,
          label: '有效期（天）',
          min: 0,
          admin: { description: '0 = 永久有效' },
        },
        {
          name: 'autoRenewable',
          type: 'checkbox',
          defaultValue: true,
          label: '支持自动续费',
        },
        {
          name: 'features',
          type: 'array',
          label: '型号特性列表',
          fields: [{ name: 'value', type: 'text' }],
        },
        { name: 'sort', type: 'number', defaultValue: 0 },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  timestamps: true,
}
