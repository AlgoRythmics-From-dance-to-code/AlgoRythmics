import { resendAdapter } from '@payloadcms/email-resend';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { LearningEvents } from './collections/LearningEvents';
import { AlgorithmProgress } from './collections/AlgorithmProgress';
import { Courses } from './collections/Courses';
import { CourseProgress } from './collections/CourseProgress';
import { SearchAnalytics } from './collections/SearchAnalytics';
import { Media } from './collections/Media';
import { BugReports } from './collections/BugReports';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      afterNav: ['./app/components/Payload/RoleBodyClass#default'],
    },
  },
  localization: {
    locales: [
      { label: 'Hungarian', code: 'hu' },
      { label: 'English', code: 'en' },
      { label: 'Romanian', code: 'ro' },
    ],
    defaultLocale: 'hu',
    fallback: true,
  },
  serverURL:
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000',
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    'http://localhost:3000',
  ].filter((url): url is string => Boolean(url)),
  cookiePrefix: 'algorythmics-admin',
  collections: [
    Courses,
    Users,
    LearningEvents,
    AlgorithmProgress,
    CourseProgress,
    SearchAnalytics,
    Media,
    BugReports,
  ],
  editor: lexicalEditor(),
  secret:
    process.env.PAYLOAD_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error(
            'CRITICAL: PAYLOAD_SECRET environment variable is missing in production!',
          );
        })()
      : 'dev-fallback-secret-algorythmics-12345'),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/(sslmode=)(require|prefer|verify-ca)/, '$1verify-full')
        : '',
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromAddress: 'noreply@algo-rythmics.com',
    defaultFromName: 'AlgoRythmics',
  }),
  plugins: [
    // Add plugins here
  ],
});
