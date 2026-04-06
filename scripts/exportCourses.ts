import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportCourses() {
  const payload = await getPayload({ config });

  console.log('Fetching courses from local database...');

  // Get all courses with depth 5 to catch all nested data (phases, mascot, etc.)
  const courses = await payload.find({
    collection: 'courses',
    limit: 100,
    depth: 5,
    locale: 'all', // Export all localized data
  });

  const exportPath = path.resolve(__dirname, '../lib/courses/seed_data.json');

  // Ensure directory exists
  const dir = path.dirname(exportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(exportPath, JSON.stringify(courses.docs, null, 2));

  console.log(`Successfully exported ${courses.docs.length} courses to ${exportPath}`);
  process.exit(0);
}

exportCourses().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
