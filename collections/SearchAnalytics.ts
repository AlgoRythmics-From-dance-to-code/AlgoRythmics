import type { CollectionConfig } from 'payload';
import { ROLES } from '../lib/constants';

/**
 * Collection for tracking algorithm search queries.
 * Helps identify what users are looking for and what content might be missing.
 */
export const SearchAnalytics: CollectionConfig = {
  slug: 'search-analytics',
  admin: {
    useAsTitle: 'query',
    defaultColumns: ['query', 'user', 'resultsCount', 'language', 'createdAt'],
    group: 'Analytics',
    description: 'Track what users search for in the algorithm library.',
  },
  access: {
    create: ({ req: { user } }) => !!user, // Authenticated users can log searches
    read: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
    update: () => false, // Immutable
    delete: ({ req: { user } }) => user?.role === ROLES.ADMIN,
  },
  fields: [
    {
      name: 'query',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: false, // Optional if we ever allow guest search tracking
      index: true,
    },
    {
      name: 'resultsCount',
      type: 'number',
      required: true,
      admin: {
        description: 'Number of results found for this query.',
      },
    },
    {
      name: 'language',
      type: 'select',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Hungarian', value: 'hu' },
        { label: 'Romanian', value: 'ro' },
      ],
      required: true,
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        description: 'Selected category filter when search was performed (if any).',
      },
    },
  ],
};
