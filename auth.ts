import { randomUUID } from 'crypto';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { ROLES, ROUTES, API_ROUTES, APP_CONFIG } from './lib/constants';
import logger from './lib/logger';

import { BaseUser } from './lib/types/auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          firstName: profile.first_name,
          lastName: profile.last_name,
        };
      },
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name || profile.username,
          email: profile.email,
          image: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
        };
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        remember: { label: 'Remember', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const { getPayload } = await import('payload');
          const configPromise = (await import('./payload.config')).default;
          const payload = await getPayload({ config: configPromise });

          const result = await payload.login({
            collection: 'users',
            data: {
              email: credentials.email as string,
              password: credentials.password as string,
            },
          });

          if (result && result.user && result.user.id) {
            const user = result.user as {
              id: string | number;
              firstName?: string;
              lastName?: string;
              email: string;
              role?: string;
            };
            return {
              id: user.id.toString(),
              name: user.firstName
                ? `${user.firstName} ${user.lastName || ''}`.trim()
                : user.email,
              email: user.email,
              role: user.role,
              remember: credentials.remember === 'true',
            };
          }
          logger.warn({ result: !!result }, 'Authorize: Failed (credentials or missing ID)');
          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.error({ error: message }, 'Authorize: Error (credentials)');
          return null;
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: APP_CONFIG.TOKEN_EXPIRATION_REMEMBER_ME,
  },
  pages: {
    signIn: ROUTES.LOGIN,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) {
        logger.error(
          {
            provider: account?.provider,
            hasEmail: !!user.email,
          },
          'NextAuth signIn error: Missing account or email',
        );
        return false;
      }

      if (account.provider === 'credentials') {
        return true;
      }

      try {
        const { getPayload } = await import('payload');
        const configPromise = (await import('./payload.config')).default;
        const payload = await getPayload({ config: configPromise });

        if (!payload) {
          throw new Error('Could not initialize Payload');
        }

        const existing = await payload.find({
          collection: 'users',
          where: {
            email: { equals: user.email },
          },
          limit: 1,
        });

        const docUser = user as BaseUser;
        const nameParts = docUser.name ? docUser.name.split(' ') : [];
        const firstName = docUser.firstName || nameParts[0] || '';
        const lastName = docUser.lastName || nameParts.slice(1).join(' ') || '';

        if (existing.docs.length === 0) {
          // Create new user — auto-verified, no password needed for social login
          await (payload.create as (o: unknown) => Promise<unknown>)({
            collection: 'users',
            data: {
              email: user.email,
              password: `social_${randomUUID()}`,
              role: ROLES.USER as 'user',
              _verified: true,
              authProvider: account.provider,
              authProviderId: account.providerAccountId,
              imageUrl: user.image || null,
              firstName,
              lastName,
            },
            disableVerificationEmail: true,
          });
          logger.info({ provider: account.provider }, 'New user created');
        } else {
          // Update existing user with latest provider info
          const existingUser = existing.docs[0] as unknown as BaseUser;
          const updateData: Record<string, unknown> = {};

          // Always update provider info to the latest one used
          updateData.authProvider = account.provider;
          updateData.authProviderId = account.providerAccountId;

          if (user.image && user.image !== existingUser.imageUrl) {
            updateData.imageUrl = user.image;
          }
          if (!existingUser._verified) {
            updateData._verified = true;
          }
          // Only sync name if current names are empty/null to preserve manual edits
          if (!existingUser.firstName && firstName) {
            updateData.firstName = firstName;
          }
          if (!existingUser.lastName && lastName) {
            updateData.lastName = lastName;
          }

          if (Object.keys(updateData).length > 0) {
            await (payload.update as (o: unknown) => Promise<unknown>)({
              collection: 'users',
              id: existingUser.id as string | number,
              data: updateData,
              disableVerificationEmail: true,
            });
            logger.info({ provider: account.provider }, 'Updated user with latest provider info');
          }
        }

        return true;
      } catch (error) {
        logger.error({ error }, 'NextAuth signIn callback: CRITICAL ERROR');
        return false;
      }
    },

    async jwt({ token, account, user, trigger, session }) {
      if (user) {
        token.provider = account?.provider;
        token.email = user.email;
        token.remember = (user as BaseUser).remember;
        token.iat = Math.floor(Date.now() / 1000);
      }

      // Dynamic expiry enforcement
      if (token.iat && !token.remember) {
        const now = Math.floor(Date.now() / 1000);
        if (now - (token.iat as number) > APP_CONFIG.TOKEN_EXPIRATION_DEFAULT) {
          return null; // Invalidates the session
        }
      }

      // If manually updated via update() in the frontend
      if (trigger === 'update' && session) {
        // Merge provided session data into token
        if (session.firstName) token.firstName = session.firstName;
        if (session.lastName) token.lastName = session.lastName;
        if (session.bio) token.bio = session.bio;
        token.updatedAt = Date.now(); // Force update
      }

      // Sync from DB on sign-in or session update
      if (token.email && (account || trigger === 'update')) {
        try {
          const { getPayload } = await import('payload');
          const configPromise = (await import('./payload.config')).default;
          const payload = await getPayload({ config: configPromise });

          const result = await payload.find({
            collection: 'users',
            where: { email: { equals: token.email } },
            limit: 1,
            depth: 0,
          });

          if (result.docs.length > 0) {
            const dbUser = result.docs[0] as {
              id?: string | number;
              role?: string;
              firstName?: string;
              lastName?: string;
              imageUrl?: string | null;
              bio?: string;
              authProvider?: string;
              createdAt?: string;
            };
            token.id = dbUser.id?.toString();
            token.role = dbUser.role;
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName;
            token.imageUrl = dbUser.imageUrl;
            token.bio = dbUser.bio;
            token.authProvider = dbUser.authProvider;
            token.createdAt = dbUser.createdAt;
          }
        } catch (error) {
          logger.error({ error }, 'JWT callback profile sync error');
        }
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: { user: BaseUser; expires: string };
      token: Record<string, unknown>;
    }) {
      if (token && session.user) {
        session.user.id = String(token.id || '');
        session.user.role = String(token.role || '');
        session.user.firstName = String(token.firstName || '');
        session.user.lastName = String(token.lastName || '');
        session.user.imageUrl = token.imageUrl as string | null;
        session.user.bio = String(token.bio || '');
        session.user.authProvider = String(token.authProvider || '');
        session.user.createdAt = String(token.createdAt || '');
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // After social login, redirect to our custom callback ONLY if we're completing sign-in
      // This prevents sign-out or other redirects from being trapped in a loop
      if (url.includes('/api/auth/callback') || url.includes('callback')) {
        return `${baseUrl}${API_ROUTES.AUTH.SOCIAL_CALLBACK}`;
      }

      // If it's a relative URL, resolve it to our domain
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // Allow only same-origin redirects
      if (new URL(url).origin === baseUrl) return url;

      return baseUrl;
    },
  },
});
