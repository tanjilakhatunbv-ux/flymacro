import type { CollectionConfig } from 'payload'
import { anyone, isOperatorOrAbove } from '../lib/access'

export const Classes: CollectionConfig = {
  slug: 'classes',
  labels: { singular: '职业', plural: '职业' },
  admin: {
    useAsTitle: 'nameZh',
    defaultColumns: ['slug', 'nameZh', 'nameEn', 'color'],
    group: '魔兽数据',
  },
  access: {
    read: anyone,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isOperatorOrAbove,
  },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true, label: '标识符' },
    { name: 'nameZh', type: 'text', required: true, label: '中文名' },
    { name: 'nameEn', type: 'text', required: true, label: '英文名' },
    {
      name: 'color',
      type: 'text',
      required: true,
      label: '职业色 (hex)',
      admin: { description: '例如 #C69B6D' },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: '职业图标 (SVG)',
    },
    { name: 'sort', type: 'number', defaultValue: 0, label: '排序', admin: { position: 'sidebar' } },
  ],
}
