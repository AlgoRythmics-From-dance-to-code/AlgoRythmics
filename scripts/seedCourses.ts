import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function flattenLocales(data: any, locale: string): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map((item) => flattenLocales(item, locale));

  const result: any = {};
  for (const key in data) {
    const value = data[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Check if this looks like a localized field object
      const keys = Object.keys(value);
      if (keys.includes('hu') || keys.includes('en') || keys.includes('ro')) {
        result[key] = value[locale] !== undefined ? value[locale] : value['hu'] || null;
      } else {
        result[key] = flattenLocales(value, locale);
      }
    } else {
      result[key] = flattenLocales(value, locale);
    }
  }
  return result;
}

async function seed() {
  const payload = await getPayload({ config });

  console.log('Seeding courses from local JSON data (Multi-language support)...');

  const seedPath = path.resolve(__dirname, '../lib/courses/seed_data.json');

  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found at ${seedPath}. Did you run the export script first?`);
    process.exit(1);
  }

  const coursesData = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as any[];

  console.log(`Found ${coursesData.length} courses to seed.`);

  const locales = ['hu', 'en', 'ro'];

  for (const courseDoc of coursesData) {
    const slug = typeof courseDoc.slug === 'object' ? courseDoc.slug.hu : courseDoc.slug;
    console.log(`Processing course: ${slug}...`);

    // 1. Initial creation (base record)
    const existing = await payload.find({
      collection: 'courses',
      where: { slug: { equals: slug } },
    });

    let courseId: any;
    if (existing.docs.length > 0) {
      courseId = existing.docs[0].id;
    } else {
      // Create first with HU data
      const huData = flattenLocales(courseDoc, 'hu');
      const result = await payload.create({
        collection: 'courses',
        data: huData,
        locale: 'hu',
      });
      courseId = result.id;
    }

    // 2. Multi-pass update for each locale to ensure all translations are saved
    for (const locale of locales) {
      console.log(`  Updating locale: ${locale}`);
      const localizedData = flattenLocales(courseDoc, locale);
      
      // Remove ID and timestamps to avoid conflicts during update
      delete localizedData.id;
      delete localizedData.updatedAt;
      delete localizedData.createdAt;
      
      await payload.update({
        collection: 'courses',
        id: courseId,
        data: localizedData,
        locale: locale as any,
      });
    }
  }

  console.log('Multi-language seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
