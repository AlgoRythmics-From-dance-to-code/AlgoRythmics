import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "auth_provider" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "auth_provider" SET DEFAULT 'email'::text;
  DROP TYPE "public"."enum_users_auth_provider";
  CREATE TYPE "public"."enum_users_auth_provider" AS ENUM('email', 'google', 'discord', 'github');
  ALTER TABLE "users" ALTER COLUMN "auth_provider" SET DEFAULT 'email'::"public"."enum_users_auth_provider";
  ALTER TABLE "users" ALTER COLUMN "auth_provider" SET DATA TYPE "public"."enum_users_auth_provider" USING "auth_provider"::"public"."enum_users_auth_provider";
  ALTER TABLE "courses_phases_locales" ALTER COLUMN "info_content" SET DATA TYPE jsonb USING (
    CASE 
      WHEN info_content IS NULL OR trim(info_content) = '' THEN NULL 
      WHEN trim(info_content) LIKE '{%' OR trim(info_content) LIKE '[%' THEN info_content::jsonb 
      ELSE to_jsonb(info_content) 
    END
  );`);
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_auth_provider" ADD VALUE 'facebook' BEFORE 'discord';
  ALTER TABLE "courses_phases_locales" ALTER COLUMN "info_content" SET DATA TYPE varchar USING (info_content #>> '{}');`);
}
