import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isOperatorOrAbove, publishedOrStaff } from '../lib/access'

export const Guides: CollectionConfig = {
  slug: 'guides',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'weight', 'publishedAt', '_status'],
    group: '内容',
    description: '新手教程与使用指南。weight 越小越靠前。',
    listSearchableFields: ['title', 'slug', 'summary'],
    preview: (doc) => {
      const slug = (doc as { slug?: string })?.slug
      return slug ? `/guide/${slug}` : null
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
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea', label: '简介', maxLength: 240 },
    { name: 'weight', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: '排序权重，数值越小越靠前' } },
    { name: 'cover', type: 'upload', relationTo: 'media', label: '封面' },
    {
      name: 'body',
      type: 'richText',
      label: '正文',
      editor: lexicalEditor({}),
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
  timestamps: true,
}
