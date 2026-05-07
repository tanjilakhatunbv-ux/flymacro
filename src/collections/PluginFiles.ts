import type { CollectionConfig } from 'payload'
import { anyone, isOperatorOrAbove, isSuperAdmin } from '../lib/access'

export const PluginFiles: CollectionConfig = {
  slug: 'plugin-files',
  admin: {
    group: '插件',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'filesize', 'updatedAt'],
    description: '插件文件上传库，支持 .zip 等压缩包格式。',
  },
  access: {
    read: anyone,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isSuperAdmin,
  },
  upload: {
    staticDir: 'plugin-files',
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/octet-stream',
    ],
  },
  fields: [
    { name: 'description', type: 'text', label: '文件说明' },
  ],
}
