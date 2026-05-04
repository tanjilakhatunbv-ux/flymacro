import type { CollectionConfig } from 'payload'
import { isOwnerOrStaff, isOperatorOrAbove, isSuperAdmin } from '../lib/access'

export const MacroExchanges: CollectionConfig = {
  slug: 'macro-exchanges',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'macro', 'modelName', 'creditsSpent', 'expiresAt', 'autoRenew', 'grantedAt'],
    group: '商务',
  },
  access: {
    read: isOwnerOrStaff,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isSuperAdmin,
  },
  indexes: [
    { fields: ['user', 'macro'] },
  ],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'macro', type: 'relationship', relationTo: 'macros', required: true, index: true },
    { name: 'modelName', type: 'text', label: '兑换的型号名' },
    { name: 'creditsSpent', type: 'number', required: true, label: '花费积分' },
    {
      name: 'grantedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      label: '兑换时间',
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: '过期时间',
      admin: { description: '留空 = 永久有效' },
    },
    {
      name: 'autoRenew',
      type: 'checkbox',
      defaultValue: false,
      label: '自动续费',
    },
    {
      name: 'revokedAt',
      type: 'date',
      label: '撤销时间',
    },
  ],
  timestamps: true,
}
