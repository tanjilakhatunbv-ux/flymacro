import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isOperatorOrAbove, publishedOrStaff } from '../lib/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: '页面', plural: '页面' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status'],
    group: '内容',
    description: '独立页面（关于、联系、隐私政策等）。',
    listSearchableFields: ['title', 'slug'],
    preview: (doc) => {
      const slug = (doc as { slug?: string })?.slug
      return slug ? `/${slug}` : null
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
