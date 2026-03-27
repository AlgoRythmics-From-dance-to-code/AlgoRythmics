import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_auth_provider" AS ENUM('email', 'google', 'facebook', 'discord', 'github');
  ALTER TABLE "users" ADD COLUMN "auth_provider" "enum_users_auth_provider" DEFAULT 'email';
  ALTER TABLE "users" ADD COLUMN "auth_provider_id" varchar;
  ALTER TABLE "users" ADD COLUMN "_verified" boolean;
  ALTER TABLE "users" ADD COLUMN "_verificationtoken" varchar;`);
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "auth_provider";
  ALTER TABLE "users" DROP COLUMN "auth_provider_id";
  ALTER TABLE "users" DROP COLUMN "_verified";
  ALTER TABLE "users" DROP COLUMN "_verificationtoken";
  DROP TYPE "public"."enum_users_auth_provider";`);
}
