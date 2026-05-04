import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isOperatorOrAbove, publishedOrStaff } from '../lib/access'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'pinned', 'publishedAt', '_status'],
    group: '内容',
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
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea', maxLength: 240 },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'announcement',
      options: [
        { label: '公告', value: 'announcement' },
        { label: '博客', value: 'blog' },
        { label: '更新日志', value: 'changelog' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'pinned', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: '置顶' } },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
  timestamps: true,
}
