import type { CollectionConfig } from 'payload'
import { anyone, isOperatorOrAbove } from '../lib/access'

export const Specs: CollectionConfig = {
  slug: 'specs',
  labels: { singular: '专精', plural: '专精' },
  admin: {
    useAsTitle: 'nameZh',
    defaultColumns: ['slug', 'nameZh', 'nameEn', 'class', 'role'],
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
      name: 'class',
      type: 'relationship',
      relationTo: 'classes',
      required: true,
      label: '所属职业',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      label: '职责',
      options: [
        { label: '坦克', value: 'tank' },
        { label: '治疗', value: 'healer' },
        { label: '近战 DPS', value: 'melee-dps' },
        { label: '远程 DPS', value: 'ranged-dps' },
      ],
    },
    { name: 'sort', type: 'number', defaultValue: 0, label: '排序', admin: { position: 'sidebar' } },
  ],
}
