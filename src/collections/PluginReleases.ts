import type { CollectionConfig } from 'payload'
import { isOperatorOrAbove, isSuperAdmin } from '../lib/access'
import type { UserRole } from '../lib/access'

type AnyUser = { id: string | number; role?: UserRole }

const hasRole = (user: AnyUser | null | undefined, ...roles: UserRole[]) =>
  !!user && !!user.role && roles.includes(user.role)

export const PluginReleases: CollectionConfig = {
  slug: 'plugin-releases',
  admin: {
    group: '插件',
    useAsTitle: 'version',
    defaultColumns: ['version', 'publishedAt', 'isPublished', 'deliveryMode'],
    description: '插件版本管理：上传文件或提供云盘链接。',
    listSearchableFields: ['version', 'changelog'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (hasRole(user as AnyUser | null, 'super-admin', 'operator', 'support')) return true
      return { isPublished: { equals: true } }
    },
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'version',
      type: 'text',
      required: true,
      label: '版本号',
      admin: { description: '例如 v1.2.0' },
    },
    {
      name: 'changelog',
      type: 'textarea',
      label: '更新说明',
      maxLength: 4000,
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      label: '发布日期',
      admin: { position: 'sidebar', description: '格式 YYYY-MM-DD' },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: false,
      label: '已发布',
      admin: { position: 'sidebar', description: '发布后前台可见' },
    },
    {
      name: 'deliveryMode',
      type: 'select',
      required: true,
      options: [
        { label: '上传文件', value: 'file' },
        { label: '云盘链接', value: 'link' },
      ],
      defaultValue: 'file',
      label: '交付方式',
      admin: { position: 'sidebar' },
    },
    {
      name: 'pluginFile',
      type: 'upload',
      relationTo: 'plugin-files',
      label: '插件文件',
      admin: {
        description: '上传 .zip 等插件压缩包',
        condition: (data) => data.deliveryMode === 'file',
      },
    },
    {
      name: 'cloudUrl',
      type: 'text',
      label: '云盘下载链接',
      admin: {
        description: '例如百度网盘、夸克网盘等分享链接',
        condition: (data) => data.deliveryMode === 'link',
      },
    },
    {
      name: 'cloudPassword',
      type: 'text',
      label: '提取码',
      admin: {
        description: '如有提取码请填写',
        condition: (data) => data.deliveryMode === 'link',
      },
    },
  ],
  timestamps: true,
}
