import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // This migration is intentionally a no-op. We run a benign query so that
  // the migration is not treated as an empty placeholder.
  await db.execute(sql`SELECT 1;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Down migration mirrors the no-op behavior of the "up" migration.
  await db.execute(sql`SELECT 1;`);
}
