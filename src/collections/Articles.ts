import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isOperatorOrAbove, publishedOrStaff } from '../lib/access'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: '文章', plural: '文章' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'pinned', 'publishedAt', '_status'],
    group: '内容',
    description: '站内文章：公告、博客、更新日志。',
    listSearchableFields: ['title', 'slug', 'summary'],
    preview: (doc) => {
      const slug = (doc as { slug?: string })?.slug
      return slug ? `/blog/${slug}` : null
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
    { name: 'summary', type: 'textarea', label: '简介', maxLength: 240 },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'announcement',
      label: '分类',
      options: [
        { label: '公告', value: 'announcement' },
        { label: '博客', value: 'blog' },
        { label: '更新日志', value: 'changelog' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'pinned', type: 'checkbox', defaultValue: false, label: '置顶', admin: { position: 'sidebar', description: '置顶' } },
    { name: 'cover', type: 'upload', relationTo: 'media', label: '封面' },
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
