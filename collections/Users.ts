import type { CollectionConfig } from 'payload';
import { ROLES, ROUTES, AUTH_PROVIDERS, APP_CONFIG } from '../lib/constants';
import logger from '../lib/logger';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    verify: {
      generateEmailHTML: ({ token }) => {
        const url = `${APP_CONFIG.BASE_URL}${ROUTES.VERIFY}?token=${token}`;
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
  },
  hooks: {
    beforeLogin: [
      async ({ user, req }) => {
        // Automatically verify admins on login if they aren't verified yet
        if (user && user.role === ROLES.ADMIN && !user._verified) {
          try {
            await req.payload.update({
              collection: 'users',
              id: user.id,
              data: {
                _verified: true,
              },
            });
            user._verified = true;
          } catch (e) {
            logger.error({ error: e instanceof Error ? e.message : e }, 'Failed to auto-verify admin');
          }
        }

        // Only block verification for 'user' role
        if (user && user.role === ROLES.USER && !user._verified) {
          throw new Error('Ellenőrizze az e-mail címét a belépéshez! (Kérjük, kattintson a megerősítő linkre az e-mailben.)');
        }
        return user;
      },
    ],
    beforeChange: [
      async ({ data }) => {
        // Automatically verify admins to prevent verification emails and admin banners
        if (data.role === ROLES.ADMIN) {
          data._verified = true;
          data._verificationToken = null;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: ROLES.ADMIN },
        { label: 'User', value: ROLES.USER },
      ],
      defaultValue: ROLES.USER,
      required: true,
    },
    {
      name: 'firstName',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'lastName',
      type: 'text',
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
        position: 'sidebar',
      },
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
      },
    },
    {
      name: 'authProviderId',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
  ],
};
