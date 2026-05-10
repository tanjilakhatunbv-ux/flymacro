import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isOperatorOrAbove, publishedOrStaff } from '../lib/access'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: '新闻', plural: '新闻' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'pinned', 'publishedAt', '_status'],
    group: '内容',
    description: '魔兽世界插件研发相关新闻与资讯。',
    listSearchableFields: ['title', 'slug', 'summary'],
    preview: (doc) => {
      const slug = (doc as { slug?: string })?.slug
      return slug ? `/news/${slug}` : null
    },
  },
  access: {
    read: publishedOrStaff,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isOperatorOrAbove,
  },
  versions: {
    drafts: { autosave: { interval: 2000 } },
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: '标题' },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, label: '标识符' },
    { name: 'summary', type: 'textarea', label: '简介', maxLength: 300 },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'addon-dev',
      label: '分类',
      options: [
        { label: '插件开发', value: 'addon-dev' },
        { label: '技术分享', value: 'tech-share' },
        { label: '行业资讯', value: 'industry' },
        { label: '版本动态', value: 'version-update' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'author', type: 'text', label: '作者', defaultValue: 'FlyMacro 团队' },
    { name: 'pinned', type: 'checkbox', defaultValue: false, label: '置顶', admin: { position: 'sidebar', description: '置顶' } },
    { name: 'cover', type: 'upload', relationTo: 'media', label: '封面图' },
    {
      name: 'body',
      type: 'richText',
      label: '正文',
      editor: lexicalEditor({}),
    },
    { name: 'publishedAt', type: 'date', label: '发布时间', admin: { position: 'sidebar' } },
  ],
  timestamps: true,
}
