import type { CollectionConfig } from 'payload';
import { ROLES } from '../lib/constants';

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
    create: ({ req: { user }, data }) => {
      // Must be authenticated to create learning events
      if (!user) return false;
      // ADMIN and EDITOR can create anything
      if (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR) return true;
      // Enforce data.user === req.user.id for non-admins
      if (data?.user !== user.id) return false;
      return true;
    },
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR) return true;
      return { user: { equals: user.id } };
    },
    // Events are immutable — no updates allowed
    update: () => false,
    delete: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
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
