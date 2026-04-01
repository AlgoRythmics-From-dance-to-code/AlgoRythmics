import type { CollectionConfig } from 'payload';

/**
 * Immutable event log for every single user interaction with learning content.
 * Each row = one atomic event (click, play, submit, drag, etc.)
 */
export const LearningEvents: CollectionConfig = {
  slug: 'learning-events',
  admin: {
    useAsTitle: 'eventType',
    defaultColumns: ['user', 'algorithmId', 'tab', 'eventType', 'createdAt'],
    group: 'Analytics',
  },
  access: {
    // Events are created only via the backend API route
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return { user: { equals: user.id } };
    },
    // Events are immutable — no updates allowed
    update: () => false,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'algorithmId',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'e.g. bubble-sort, insertion-sort' },
    },
    {
      name: 'tab',
      type: 'select',
      required: true,
      options: [
        { label: 'Video', value: 'video' },
        { label: 'Animation', value: 'animation' },
        { label: 'Control', value: 'control' },
        { label: 'Create', value: 'create' },
        { label: 'Alive', value: 'alive' },
      ],
    },
    {
      name: 'eventType',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          'e.g. tab_enter, animation_play, control_compare, create_blank_attempt, alive_code_submit',
      },
    },
    {
      name: 'eventData',
      type: 'json',
      admin: {
        description: 'Arbitrary event-specific payload (indices, values, scores, etc.)',
      },
    },
    {
      name: 'sessionId',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'UUID grouping events within a single learning session.' },
    },
    {
      name: 'durationMs',
      type: 'number',
      admin: { description: 'Milliseconds since the previous event in this session.' },
    },
  ],
};
