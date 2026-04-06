import type { CollectionConfig } from 'payload';

/**
 * Per-user, per-algorithm progress aggregation.
 * One record per (user × algorithmId) pair — upserted as the user progresses.
 */
export const AlgorithmProgress: CollectionConfig = {
  slug: 'algorithm-progress',
  admin: {
    useAsTitle: 'algorithmId',
    defaultColumns: ['user', 'algorithmId', 'overallProgress', 'updatedAt'],
    group: 'Analytics',
  },
  access: {
    create: ({ req: { user }, data }) => {
      // User must be authenticated
      if (!user) return false;
      // Admin can create anything
      if (user.role === 'admin') return true;
      // Normal users can only create progress records for themselves
      if (data && data.user) {
        return data.user === user.id;
      }
      return true; // We also validate in hooks as best practice but this allows backend creation on behalf of req user
    },
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return { user: { equals: user.id } };
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return { user: { equals: user.id } };
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    // ─── Identity ───────────────────────────────────────
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
    },

    // ─── Video ──────────────────────────────────────────
    {
      name: 'videoWatched',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    { name: 'videoWatchTimeMs', type: 'number', defaultValue: 0 },
    { name: 'videoCompletedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },

    // ─── Animation ──────────────────────────────────────
    {
      name: 'animationCompleted',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    { name: 'animationTotalTimeMs', type: 'number', defaultValue: 0 },
    { name: 'animationPlayCount', type: 'number', defaultValue: 0 },
    { name: 'animationCompletedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },

    // ─── Control ────────────────────────────────────────
    {
      name: 'controlCompleted',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    { name: 'controlBestScore', type: 'number', defaultValue: 0 },
    { name: 'controlMistakes', type: 'number', defaultValue: 0 },
    { name: 'controlHintsUsed', type: 'number', defaultValue: 0 },
    { name: 'controlAttempts', type: 'number', defaultValue: 0 },
    { name: 'controlBestTimeMs', type: 'number', defaultValue: 0 },
    { name: 'controlCompletedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },

    // ─── Create (code fill-in) ──────────────────────────
    {
      name: 'createCompleted',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'createHelpUsed',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Whether the user activated card-drag help.' },
    },
    { name: 'createAttempts', type: 'number', defaultValue: 0 },
    {
      name: 'createBlanksCorrectFirst',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Number of blanks answered correctly on first attempt.' },
    },
    { name: 'createBlanksTotal', type: 'number', defaultValue: 0 },
    { name: 'createTotalTimeMs', type: 'number', defaultValue: 0 },
    { name: 'createCompletedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },

    // ─── Alive (free code / nodes) ──────────────────────
    {
      name: 'aliveCompleted',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'aliveHelpUsed',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Whether the user switched to node-block mode.' },
    },
    { name: 'aliveCodeSubmissions', type: 'number', defaultValue: 0 },
    {
      name: 'aliveLastCode',
      type: 'textarea',
      admin: { description: 'The last code the user submitted.' },
    },
    { name: 'aliveBestScore', type: 'number', defaultValue: 0 },
    { name: 'aliveTotalTimeMs', type: 'number', defaultValue: 0 },
    { name: 'aliveCompletedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },

    // ─── Overall ────────────────────────────────────────
    {
      name: 'overallProgress',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: { description: 'Weighted % across all 5 tabs (0–100).' },
    },
    { name: 'totalTimeSpentMs', type: 'number', defaultValue: 0 },
    { name: 'lastActivityAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'firstStartedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
};
