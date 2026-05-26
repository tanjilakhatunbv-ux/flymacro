import type { CollectionConfig, Where } from 'payload'
import { revalidateTag } from 'next/cache'
import { isOperatorOrAbove, isSuperAdmin } from '../lib/access'
import type { UserRole } from '../lib/access'

type AnyUser = { id: string | number; role?: UserRole }

const hasRole = (user: AnyUser | null | undefined, ...roles: UserRole[]) =>
  !!user && !!user.role && roles.includes(user.role)

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const Scripts: CollectionConfig = {
  slug: 'scripts',
  labels: { singular: '脚本', plural: '脚本' },
  admin: {
    group: '脚本管理',
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'status', 'updatedAt'],
    description: '脚本项目管理：先创建脚本项目，再在其下添加版本和上传文件。发布流程：1) 创建脚本项目 2) 上传文件到「脚本文件」3) 创建版本并选择文件 4) 将版本状态设为「已发布」。',
    listSearchableFields: ['name', 'slug'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (hasRole(user as AnyUser | null, 'admin', 'operator')) return true
      return { status: { equals: 'published' } } as Where
    },
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isSuperAdmin,
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: '脚本名称',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: '标识',
      admin: {
        position: 'sidebar',
        description: '留空将根据名称自动生成，影响前台 URL',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) return value
            if (data?.name) return slugify(String(data.name))
            return value
          },
        ],
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'macro',
      label: '脚本类型',
      options: [
        { label: '宏命令', value: 'macro' },
        { label: '插件', value: 'addon' },
        { label: '工具', value: 'tool' },
        { label: '其他', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      label: '简介',
      maxLength: 240,
      admin: { description: '一句话描述用途' },
    },
    {
      name: 'description',
      type: 'richText',
      label: '详细说明',
      admin: { description: '脚本的详细功能说明和使用文档' },
    },
    {
      name: 'author',
      type: 'text',
      label: '作者',
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: '状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
        { label: '已归档', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: '发布日期',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'latestVersion',
      type: 'relationship',
      relationTo: 'script-versions',
      label: '最新版本',
      admin: {
        position: 'sidebar',
        description: '当前已发布的最新版本（自动维护）',
        readOnly: true,
      },
      filterOptions: {
        isLatest: { equals: true },
      },
    },
    {
      name: 'versionsJoin',
      type: 'join',
      collection: 'script-versions',
      on: 'script',
      label: '版本历史',
      admin: {
        description: '该脚本的所有历史版本',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (
          (data as Record<string, unknown>).status === 'published' &&
          !originalDoc?.publishedAt &&
          !(data as Record<string, unknown>).publishedAt
        ) {
          ;(data as Record<string, unknown>).publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      async () => {
        try { revalidateTag('scripts', 'max') } catch { /* ignore */ }
      },
    ],
    afterDelete: [
      async () => {
        try { revalidateTag('scripts', 'max') } catch { /* ignore */ }
      },
    ],
  },
  timestamps: true,
}
