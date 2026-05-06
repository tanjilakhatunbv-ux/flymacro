import type { CollectionConfig } from 'payload'
import { isOwnerOrStaff, isStaff, isSuperAdmin } from '../lib/access'

export const MacroExchanges: CollectionConfig = {
  slug: 'macro-exchanges',
  admin: {
    useAsTitle: 'macro',
    defaultColumns: ['macro', 'user', 'creditsSpent', 'expiresAt', 'autoRenew', 'grantedAt'],
    group: '商务',
    description: '宏兑换记录。每条记录表示一个用户用积分解锁了某个宏。',
    listSearchableFields: ['creditsSpent'],
  },
  access: {
    read: isOwnerOrStaff,
    create: isStaff,
    update: isOwnerOrStaff,
    delete: isSuperAdmin,
  },
  indexes: [
    { fields: ['user', 'macro'] },
  ],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true, label: '用户' },
    { name: 'macro', type: 'relationship', relationTo: 'macros', required: true, index: true, label: '宏' },
    {
      name: 'creditsSpent',
      type: 'number',
      required: true,
      label: '花费积分',
      admin: { readOnly: true, description: '兑换后不可修改，避免破坏对账' },
    },
    {
      name: 'grantedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      label: '兑换时间',
      admin: { readOnly: true },
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
      admin: { description: '设置后该兑换记录将不再授予访问权限' },
    },
  ],
  timestamps: true,
}
