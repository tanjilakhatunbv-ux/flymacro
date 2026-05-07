import type { CollectionConfig } from 'payload'
import { anyone, isOperatorOrAbove } from '../lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: '媒体库', plural: '媒体库' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    group: '内容',
    description: '媒体库：图片、视频、PDF。已建预览图、卡片、封面、社交分享四个尺寸。',
  },
  access: {
    read: anyone,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isOperatorOrAbove,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 320, height: 320, position: 'centre' },
      { name: 'card', width: 640, height: 360, position: 'centre' },
      { name: 'hero', width: 1600, height: 900, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    { name: 'alt', type: 'text', label: '替代文本（无障碍 + SEO）' },
    { name: 'caption', type: 'text', label: '说明' },
  ],
}
