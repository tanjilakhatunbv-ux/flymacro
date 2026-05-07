import type { CollectionConfig } from 'payload'
import { isOwnerOrStaff, isStaff, isSuperAdmin } from '../lib/access'

export const CreditOrders: CollectionConfig = {
  slug: 'credit-orders',
  labels: { singular: '充值订单', plural: '充值订单' },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'amount', 'creditsGranted', 'status', 'createdAt'],
    group: '商务',
    description: '充值订单。仅由支付 webhook 程序化创建，财务字段在后台只读以保护对账完整性。',
    listSearchableFields: ['orderNumber', 'dodoCheckoutId'],
  },
  access: {
    read: isOwnerOrStaff,
    create: () => false,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: '订单号',
      admin: { readOnly: true },
    },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true, label: '用户' },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: '支付金额',
      admin: { readOnly: true, description: '财务数据不可修改' },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'CNY',
      label: '币种',
      options: [
        { label: '人民币 CNY', value: 'CNY' },
        { label: '美元 USD', value: 'USD' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'creditsGranted',
      type: 'number',
      required: true,
      label: '获得积分',
      admin: { readOnly: true, description: '财务数据不可修改' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: '订单状态',
      options: [
        { label: '待支付', value: 'pending' },
        { label: '已支付', value: 'paid' },
        { label: '失败', value: 'failed' },
      ],
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'dodoCheckoutId',
      type: 'text',
      index: true,
      unique: true,
      label: 'DodoPayments 会话 ID',
      admin: { readOnly: true, description: 'DodoPayments checkout session ID' },
    },
    {
      name: 'paidAt',
      type: 'date',
      label: '支付完成时间',
      admin: { readOnly: true },
    },
    {
      name: 'meta',
      type: 'json',
      label: '原始 webhook payload',
      admin: { readOnly: true, description: '调试用，请勿手动修改' },
    },
  ],
  timestamps: true,
}
