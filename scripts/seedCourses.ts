import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const payload = await getPayload({ config });

  console.log('Seeding courses from local JSON data...');

  const seedPath = path.resolve(__dirname, '../lib/courses/seed_data.json');

  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found at ${seedPath}. Did you run the export script first?`);
    process.exit(1);
  }

  const coursesData = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as Record<string, unknown>[];

  console.log(`Found ${coursesData.length} courses to seed.`);

  for (const courseDoc of coursesData) {
    console.log(`Creating/Updating course: ${courseDoc.slug}...`);

    // Check if course already exists
    const existing = await payload.find({
      collection: 'courses',
      where: {
        slug: {
          equals: courseDoc.slug,
        },
      },
    });

    if (existing.docs.length > 0) {
      console.log(`Course ${courseDoc.slug} already exists. Updating...`);
      await payload.update({
        collection: 'courses',
        id: existing.docs[0].id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: courseDoc as any,
      });
    } else {
      console.log(`Creating new course: ${courseDoc.slug}`);
      await payload.create({
        collection: 'courses',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: courseDoc as any,
        locale: 'hu', // Default locale to start with (since Payload will populate other locales from the object if it has all keys)
      });
    }
  }

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
