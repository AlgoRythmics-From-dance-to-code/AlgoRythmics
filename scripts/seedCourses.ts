import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively flatten localized field objects ({hu: ..., en: ..., ro: ...})
 * into a single value for the specified locale.
 */
function flattenLocales(data: any, locale: string): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map((item) => flattenLocales(item, locale));

  const result: any = {};
  for (const key in data) {
    const value = data[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value);
      // Check if this looks like a localized field object
      if (keys.includes('hu') || keys.includes('en') || keys.includes('ro')) {
        result[key] = value[locale] !== undefined ? value[locale] : value['hu'] ?? null;
      } else {
        result[key] = flattenLocales(value, locale);
      }
    } else {
      result[key] = flattenLocales(value, locale);
    }
  }
  return result;
}

/**
 * Remove all Payload-internal fields that shouldn't be passed during create/update.
 */
function stripInternalFields(data: any): any {
  const stripped = { ...data };
  delete stripped.id;
  delete stripped.updatedAt;
  delete stripped.createdAt;
  delete stripped._status;
  // Strip nested array item IDs that Payload may reject as duplicates
  if (stripped.phases && Array.isArray(stripped.phases)) {
    stripped.phases = stripped.phases.map((p: any) => {
      const { id, ...rest } = p;
      // Also strip nested quiz/matching/ordering/gapFillOptions IDs
      if (rest.quiz && Array.isArray(rest.quiz)) {
        rest.quiz = rest.quiz.map((q: any) => {
          const { id: qId, ...qRest } = q;
          if (qRest.options && Array.isArray(qRest.options)) {
            qRest.options = qRest.options.map((o: any) => {
              const { id: oId, ...oRest } = o;
              return oRest;
            });
          }
          return qRest;
        });
      }
      if (rest.matching && Array.isArray(rest.matching)) {
        rest.matching = rest.matching.map((m: any) => { const { id: mId, ...mRest } = m; return mRest; });
      }
      if (rest.ordering && Array.isArray(rest.ordering)) {
        rest.ordering = rest.ordering.map((o: any) => { const { id: oId, ...oRest } = o; return oRest; });
      }
      if (rest.gapFillOptions && Array.isArray(rest.gapFillOptions)) {
        rest.gapFillOptions = rest.gapFillOptions.map((g: any) => { const { id: gId, ...gRest } = g; return gRest; });
      }
      return rest;
    });
  }
  // Strip mascot nested IDs
  if (stripped.mascot) {
    const m = { ...stripped.mascot };
    ['welcomeMessages', 'overconfidentMessages', 'streakMessages'].forEach((field) => {
      if (m[field] && Array.isArray(m[field])) {
        m[field] = m[field].map((item: any) => {
          const { id, ...rest } = item;
          return rest;
        });
      }
    });
    stripped.mascot = m;
  }
  return stripped;
}

async function seed() {
  console.log('[Seed] Initializing Payload...');
  const payload = await getPayload({ config });

  console.log('[Seed] Seeding courses from local JSON data (Multi-language support)...');

  const seedPath = path.resolve(__dirname, '../lib/courses/seed_data.json');

  if (!fs.existsSync(seedPath)) {
    console.warn(`[Seed] Seed file not found at ${seedPath}. Skipping seed (not an error on first deploy).`);
    process.exit(0);
  }

  const coursesData = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as any[];
  console.log(`[Seed] Found ${coursesData.length} courses to seed.`);

  if (coursesData.length === 0) {
    console.log('[Seed] No courses to seed. Done.');
    process.exit(0);
  }

  const locales = ['hu', 'en', 'ro'];

  for (const courseDoc of coursesData) {
    const slug = typeof courseDoc.slug === 'object' ? courseDoc.slug.hu : courseDoc.slug;
    console.log(`[Seed] Processing course: ${slug}...`);

    try {
      // 1. Check if already exists
      const existing = await payload.find({
        collection: 'courses',
        where: { slug: { equals: slug } },
        limit: 1,
      });

      let courseId: any;

      if (existing.docs.length > 0) {
        courseId = existing.docs[0].id;
        console.log(`[Seed]   Course "${slug}" already exists (id=${courseId}), updating...`);
      } else {
        // Create with HU data first
        const huData = stripInternalFields(flattenLocales(courseDoc, 'hu'));
        console.log(`[Seed]   Creating course "${slug}"...`);
        const result = await payload.create({
          collection: 'courses',
          data: huData,
          locale: 'hu' as any,
        });
        courseId = result.id;
        console.log(`[Seed]   Created course "${slug}" (id=${courseId})`);
      }

      // 2. Multi-pass update for each locale
      for (const locale of locales) {
        console.log(`[Seed]   Updating locale: ${locale}`);
        const localizedData = stripInternalFields(flattenLocales(courseDoc, locale));

        await payload.update({
          collection: 'courses',
          id: courseId,
          data: localizedData,
          locale: locale as any,
        });
      }

      console.log(`[Seed]   ✓ Course "${slug}" seeded successfully.`);
    } catch (err: any) {
      console.error(`[Seed]   ✗ Error seeding course "${slug}":`, err?.message || err);
      // Continue to next course instead of crashing the whole build
    }
  }

  console.log('[Seed] Multi-language seed completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Fatal error:', err?.message || err);
  process.exit(1);
});
