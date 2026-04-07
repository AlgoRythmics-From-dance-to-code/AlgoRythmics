import type { CollectionConfig } from 'payload';
import { ROLES } from '../lib/constants';

export const CourseProgress: CollectionConfig = {
  slug: 'course-progress',
  admin: {
    useAsTitle: 'courseId',
    group: 'Analytics',
    defaultColumns: ['user', 'courseId', 'activePhaseIndex', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR) return true;
      return { user: { equals: user.id } };
    },
    create: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR) return true;
      return { user: { equals: user.id } };
    },
    delete: ({ req: { user } }) =>
      user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
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
      name: 'courseId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'activePhaseIndex',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'completedPhases',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'lastConfidenceRating',
      type: 'text',
    },
    {
      name: 'phaseResults',
      type: 'json',
    },
    {
      name: 'points',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'isCompleted',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'totalTimeMs',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'totalMistakes',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'mascotInteractionsTotal',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'confidenceResults',
      type: 'json',
      admin: {
        description: 'History of confidence ratings per phase',
      },
    },
    {
      name: 'firstStartedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'lastActivityAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'detailedStats',
      type: 'json',
      admin: {
        description: 'Comprehensive per-phase telemetry (time, results, mistakes, mascot help, etc.)',
      },
    },
  ],
};
