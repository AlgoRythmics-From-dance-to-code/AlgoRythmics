/**
 * Export courses from the running local dev server via REST API.
 *
 * Usage:
 *   1. Make sure `npm run dev` is running
 *   2. Run `npm run export`
 *
 * This fetches ALL locales of every course document and writes them to
 * lib/courses/seed_data.json so they can be seeded on Vercel.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000';

async function exportCourses() {
  console.log(`Fetching courses from ${BASE_URL} ...`);

  const res = await fetch(`${BASE_URL}/api/courses?limit=100&depth=5&locale=all`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`API responded with ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { docs: unknown[] };

  const exportPath = path.resolve(__dirname, '../lib/courses/seed_data.json');

  // Ensure directory exists
  const dir = path.dirname(exportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(exportPath, JSON.stringify(json.docs, null, 2));

  console.log(`✓ Exported ${json.docs.length} courses to ${exportPath}`);
  console.log('  You can now commit this file and deploy to Vercel.');
}

exportCourses().catch((err) => {
  console.error('Export failed:', err.message || err);
  process.exit(1);
});
