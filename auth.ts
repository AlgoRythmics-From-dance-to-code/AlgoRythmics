import { randomUUID } from 'crypto';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';
import { ROLES, ROUTES, API_ROUTES } from './lib/constants';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: ROUTES.LOGIN,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) {
        console.error('NextAuth signIn error: Missing account or email', { 
          provider: account?.provider, 
          hasEmail: !!user.email 
        });
        return false;
      }

    

      try {
        const { getPayload } = await import('payload');
        const configPromise = (await import('./payload.config')).default;
        const payload = await getPayload({ config: configPromise });

        if (!payload) {
          throw new Error('Could not initialize Payload');
        }

        // Check if user already exists with this email
        const existing = await payload.find({
          collection: 'users',
          where: {
            email: { equals: user.email },
          },
          limit: 1,
        });

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
            } as any,
            disableVerificationEmail: true,
          } as any);
          console.log(`New user created via ${account.provider}: ${user.email}`);
        } else {
          // Update existing user with provider info if missing
          const existingUser = existing.docs[0] as any;
          const updateData: Record<string, unknown> = {};
          
          if (!existingUser.authProvider) {
            updateData.authProvider = account.provider;
            updateData.authProviderId = account.providerAccountId;
          }
          if (!existingUser.imageUrl && user.image) {
            updateData.imageUrl = user.image;
          }
          if (!existingUser._verified) {
            updateData._verified = true;
          }

          if (Object.keys(updateData).length > 0) {
            await payload.update({
              collection: 'users',
              id: existingUser.id,
              data: updateData,
              disableVerificationEmail: true,
            } as any);
            console.log(`Updated user ${user.email} with ${account.provider} info`);
          }
        }

        return true;
      } catch (error) {
        console.error('NextAuth signIn callback: CRITICAL ERROR:', error);
        return false;
      }
    },

    async jwt({ token, account, user }) {
      if (account && user?.email) {
        token.provider = account.provider;
        token.email = user.email;
      }
      return token;
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
