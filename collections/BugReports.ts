import type { CollectionConfig } from 'payload';
import { ROLES } from '../lib/constants';

export const BugReports: CollectionConfig = {
  slug: 'bug-reports',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['description', 'severity', 'status', 'user', 'createdAt'],
    group: 'Support',
  },
  upload: {
    staticDir: 'public/uploads',
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    resizeOptions: {
      width: 854,
      height: 480,
      fit: 'inside',
      withoutEnlargement: true,
    },
    adminThumbnail: ({ doc }) => (doc?.url as string) || null,
  },
  access: {
    create: ({ req: { user }, data }) => {
      if (!user) return false;
      if (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR) return true;
      const targetUser =
        typeof data?.user === 'object' && data.user !== null
          ? (data.user as { id?: string | number }).id
          : data?.user;
      return targetUser === undefined || String(targetUser) === String(user.id);
    },
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR) return true;
      return { user: { equals: user.id } };
    },
    update: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
    delete: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
  },
  fields: [
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
    },
    {
      name: 'severity',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'pageUrl',
      type: 'text',
      required: false,
    },
    {
      name: 'userAgent',
      type: 'text',
      required: false,
    },
  ],
};
