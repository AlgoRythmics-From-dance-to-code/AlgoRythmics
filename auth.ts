import { randomUUID } from 'crypto';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { ROLES, ROUTES, API_ROUTES } from './lib/constants';

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
          
          if (result && result.user) {
            console.log('Authorize: Success for', credentials.email);
            return {
              id: result.user.id.toString(),
              name: (result.user as any).firstName ? `${(result.user as any).firstName} ${(result.user as any).lastName}` : result.user.email,
              email: result.user.email,
              role: (result.user as any).role,
            };
          }
          console.warn('Authorize: Failed for', credentials.email, 'result was', !!result);
          return null;
        } catch (error: any) {
          console.error('Authorize: Error for', credentials.email, ':', error.message || error);
          return null;
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: ROUTES.LOGIN,
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn Callback: Start for', user.email, 'with provider', account?.provider);
      if (!account || !user.email) {
        console.error('NextAuth signIn error: Missing account or email', { 
          provider: account?.provider, 
          hasEmail: !!user.email 
        });
        return false;
      }

      if (account.provider === 'credentials') {
        console.log('SignIn Callback: Skipping sync for credentials user', user.email);
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

        const nameParts = user.name ? user.name.split(' ') : [];
        const firstName = (user as any).firstName || nameParts[0] || '';
        const lastName = (user as any).lastName || nameParts.slice(1).join(' ') || '';

        if (existing.docs.length === 0) {
          // Create new user — auto-verified, no password needed for social login
          await payload.create({
            collection: 'users',
            data: {
              email: user.email,
              password: `social_${randomUUID()}`,
              role: ROLES.USER,
              _verified: true,
              authProvider: account.provider,
              authProviderId: account.providerAccountId,
              imageUrl: user.image || null,
              firstName,
              lastName,
            } as any,
            disableVerificationEmail: true,
          } as any);
          console.log(`New user created via ${account.provider}: ${user.email}`);
        } else {
          // Update existing user with latest provider info
          const existingUser = existing.docs[0] as any;
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
            await payload.update({
              collection: 'users',
              id: existingUser.id,
              data: updateData,
              disableVerificationEmail: true,
            } as any);
            console.log(`Updated user ${user.email} with latest ${account.provider} info`);
          }
        }

        return true;
      } catch (error) {
        console.error('NextAuth signIn callback: CRITICAL ERROR:', error);
        return false;
      }
    },

    async jwt({ token, account, user, trigger, session }) {
      if (account && user?.email) {
        token.provider = account.provider;
        token.email = user.email;
      }
      
      // Update from DB on sign in OR when session.update() is called OR if email exists
      if (token.email) {
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
            const dbUser = result.docs[0] as any;
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName;
            token.imageUrl = dbUser.imageUrl;
            token.bio = dbUser.bio;
            token.authProvider = dbUser.authProvider;
            token.createdAt = dbUser.createdAt;
          }
        } catch (error) {
          console.error('JWT callback profile sync error:', error);
        }
      }
      return token;
    },

    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.imageUrl = token.imageUrl;
        session.user.bio = token.bio;
        session.user.authProvider = token.authProvider;
        session.user.createdAt = token.createdAt;
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
