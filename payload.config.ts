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

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      afterNav: [
        './app/components/Payload/RoleBodyClass#default',
      ],
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
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    'https://nextjs-frontend-three-eta.vercel.app',
  ].filter(Boolean),
  cookiePrefix: 'algorythmics-admin',
  collections: [Courses, Users, LearningEvents, AlgorithmProgress, CourseProgress],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromAddress: 'onboarding@resend.dev',
    defaultFromName: 'AlgoRythmics',
  }),
  plugins: [
    // Add plugins here
  ],
});
