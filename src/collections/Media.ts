import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '../lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: '内容',
  },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 320, height: 320, position: 'centre' },
      { name: 'card', width: 640, height: 360, position: 'centre' },
      { name: 'hero', width: 1600, height: 900, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    { name: 'alt', type: 'text', label: '替代文本' },
    { name: 'caption', type: 'text', label: '说明' },
  ],
}
