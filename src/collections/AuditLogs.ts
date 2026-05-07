import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from '../lib/access'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: { singular: '操作日志', plural: '操作日志' },
  admin: {
    group: '系统',
    useAsTitle: 'action',
    defaultColumns: ['createdAt', 'action', 'operator', 'collection', 'docId'],
    description: '后台关键操作审计日志，支持按时间、操作人、操作类型筛选查询。',
    listSearchableFields: ['docId', 'reason'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin') return true
      // 运营/客服只能查看自己产生的日志
      return { operator: { equals: user.id } }
    },
    create: () => false,
    update: () => false,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      label: '操作类型',
      options: [
        { label: '创建用户', value: 'create_user' },
        { label: '更新用户', value: 'update_user' },
        { label: '删除用户', value: 'delete_user' },
        { label: '创建工单', value: 'create_ticket' },
        { label: '更新工单', value: 'update_ticket' },
        { label: '删除工单', value: 'delete_ticket' },
        { label: '创建订单', value: 'create_order' },
        { label: '更新订单', value: 'update_order' },
        { label: '删除订单', value: 'delete_order' },
        { label: '其他', value: 'other' },
      ],
    },
    {
      name: 'collection',
      type: 'text',
      required: true,
      label: '目标集合',
    },
    {
      name: 'docId',
      type: 'text',
      label: '文档ID',
    },
    {
      name: 'before',
      type: 'json',
      label: '操作前数据',
    },
    {
      name: 'after',
      type: 'json',
      label: '操作后数据',
    },
    {
      name: 'operator',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: '操作人',
    },
    {
      name: 'reason',
      type: 'textarea',
      label: '操作备注',
    },
    {
      name: 'ip',
      type: 'text',
      label: 'IP地址',
    },
  ],
  timestamps: true,
}
