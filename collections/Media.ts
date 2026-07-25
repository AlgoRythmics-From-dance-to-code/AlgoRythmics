import type { CollectionConfig } from 'payload';
import { ROLES } from '../lib/constants';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    group: 'Content',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: () => true,
    update: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
    delete: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
  },
  upload: {
    staticDir: 'public/uploads',
    mimeTypes: ['image/*'],
    // Downscale main image to max 480p resolution (max 854x480) on save to conserve disk space
    resizeOptions: {
      width: 854,
      height: 480,
      fit: 'inside',
      withoutEnlargement: true,
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 320,
        height: 180,
        fit: 'inside',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
    },
  ],
};
