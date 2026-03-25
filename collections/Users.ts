import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    verify: {
      generateEmailHTML: ({ token }) => {
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/verify?token=${token}`;
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
        if (user && user.role === 'admin' && !user._verified) {
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
            console.error('Failed to auto-verify admin:', e);
          }
        }

        // Only block verification for 'user' role
        if (user && user.role === 'user' && !user._verified) {
          throw new Error('Ellenőrizze az e-mail címét a belépéshez! (Kérjük, kattintson a megerősítő linkre az e-mailben.)');
        }
        return user;
      },
    ],
    beforeChange: [
      async ({ data }) => {
        // Automatically verify admins to prevent verification emails and admin banners
        if (data.role === 'admin') {
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
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: 'user',
      required: true,
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
        { label: 'Email', value: 'email' },
        { label: 'Google', value: 'google' },
        { label: 'Facebook', value: 'facebook' },
        { label: 'Discord', value: 'discord' },
        { label: 'GitHub', value: 'github' },
      ],
      defaultValue: 'email',
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
