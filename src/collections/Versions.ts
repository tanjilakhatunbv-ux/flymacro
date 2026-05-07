import type { CollectionConfig } from 'payload'
import { anyone, isOperatorOrAbove } from '../lib/access'

export const Versions: CollectionConfig = {
  slug: 'versions',
  labels: { singular: '游戏版本', plural: '游戏版本' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'codename', 'releasedAt', 'isCurrent'],
    group: '魔兽数据',
  },
  access: {
    read: anyone,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isOperatorOrAbove,
  },
  fields: [
    { name: 'label', type: 'text', required: true, unique: true, label: '版本号（如 11.0.5）' },
    { name: 'codename', type: 'text', label: '资料片代号' },
    { name: 'releasedAt', type: 'date', label: '发布日期' },
    { name: 'isCurrent', type: 'checkbox', defaultValue: false, label: '当前版本', admin: { position: 'sidebar' } },
  ],
}
