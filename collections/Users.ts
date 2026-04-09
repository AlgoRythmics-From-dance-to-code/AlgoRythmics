import type { CollectionConfig } from 'payload';
import { ROLES, ROUTES, AUTH_PROVIDERS, APP_CONFIG, ALGORITHMS } from '../lib/constants';
import logger from '../lib/logger';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'authProvider', 'createdAt'],
    hidden: ({ user }) => user?.role !== ROLES.ADMIN && user?.role !== ROLES.EDITOR,
  },
  auth: {
    verify: {
      generateEmailHTML: ({ token }) => {
        const url = `${APP_CONFIG.BASE_URL}${ROUTES.VERIFY}?token=${encodeURIComponent(token)}`;
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #269984;">Welcome to AlgoRythmics!</h2>
            <p>Thank you for registering. Please click the button below to verify your email address and activate your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #269984; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p><a href="${url}">${url}</a></p>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888888;">If you did not create an account, please ignore this email.</p>
          </div>
        `;
      },
    },
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token;
        if (!token) {
          logger.error('Missing token in forgotPassword.generateEmailHTML');
          throw new Error('Password reset token is missing. Unable to generate reset email.');
        }
        const url = `${APP_CONFIG.BASE_URL}${ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(token)}`;
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #269984;">Password Reset Request</h2>
            <p>You requested to reset your password for your AlgoRythmics account. Please click the button below to proceed.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #269984; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p><a href="${url}">${url}</a></p>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888888;">If you did not request a password reset, please ignore this email. This link will expire in 1 hour.</p>
          </div>
        `;
      },
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR) return true;
      return { id: { equals: user.id } };
    },
    create: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR) return true;
      return { id: { equals: user.id } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === ROLES.ADMIN) return true;
      return { id: { equals: user.id } };
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users' });
          if (totalDocs === 0) {
            data.role = ROLES.ADMIN;
          }
        }
        return data;
      },
    ],
    beforeLogin: [
      async ({ user }) => {
        if (user && user.role === ROLES.USER && !user._verified) {
          throw new Error('Ellenőrizze az e-mail címét a belépéshez!');
        }
        return user;
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          admin: { width: '50%' },
        },
        {
          name: 'lastName',
          type: 'text',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: ROLES.ADMIN },
        { label: 'Editor', value: ROLES.EDITOR },
        { label: 'User', value: ROLES.USER },
      ],
      defaultValue: ROLES.USER,
      required: true,
      access: {
        update: ({ req: { user } }) => user?.role === ROLES.ADMIN,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: {
        description: 'Profile image URL (synced from social providers).',
      },
    },
    {
      name: 'mascotEnabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Engedélyezze vagy tiltsa le a segítő kabalaállat megjelenését.',
      },
    },
    {
      name: 'completedAlgorithms',
      type: 'select',
      hasMany: true,
      options: ALGORITHMS.map((algo) => ({
        label: algo.id
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: algo.id,
      })),
      admin: {
        position: 'sidebar',
        description: 'Algorithms the user has already mastered.',
      },
    },
    {
      name: 'completedCourses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Kurzusok, amiket a felhasználó már teljesített.',
      },
    },
    {
      name: 'visualizerProgress',
      type: 'json',
      admin: {
        description: 'Persistent state of the algorithm visualizer for each algorithm.',
      },
    },
    {
      name: 'learningStats',
      type: 'group',
      admin: { description: 'Aggregated learning statistics across all algorithms.' },
      fields: [
        { name: 'totalTimeSpentMs', type: 'number', defaultValue: 0 },
        { name: 'totalAlgorithmsStarted', type: 'number', defaultValue: 0 },
        { name: 'totalAlgorithmsCompleted', type: 'number', defaultValue: 0 },
        { name: 'totalControlAttempts', type: 'number', defaultValue: 0 },
        { name: 'totalCreateAttempts', type: 'number', defaultValue: 0 },
        { name: 'totalAliveAttempts', type: 'number', defaultValue: 0 },
        { name: 'totalMistakes', type: 'number', defaultValue: 0 },
        { name: 'totalHintsUsed', type: 'number', defaultValue: 0 },
        { name: 'averageScore', type: 'number', defaultValue: 0 },
        { name: 'currentStreak', type: 'number', defaultValue: 0 },
        { name: 'longestStreak', type: 'number', defaultValue: 0 },
        { name: 'lastActiveDate', type: 'date' },
        { name: 'preferredSpeed', type: 'number' },
      ],
    },
    {
      name: 'authProvider',
      type: 'select',
      options: [
        { label: 'Email', value: AUTH_PROVIDERS.EMAIL },
        { label: 'Google', value: AUTH_PROVIDERS.GOOGLE },
        { label: 'Facebook', value: AUTH_PROVIDERS.FACEBOOK },
        { label: 'Discord', value: AUTH_PROVIDERS.DISCORD },
        { label: 'GitHub', value: AUTH_PROVIDERS.GITHUB },
      ],
      defaultValue: AUTH_PROVIDERS.EMAIL,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'authProviderId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'lastResetRequest',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
};
