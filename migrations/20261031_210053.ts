import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_courses_visibility" AS ENUM('public', 'private');
  CREATE TYPE "public"."enum_courses_mascot_mode" AS ENUM('disabled', 'ai-only', 'ai-fallback', 'manual-only');
  CREATE TABLE "ai_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"model" varchar DEFAULT 'google/gemini-2.5-flash' NOT NULL,
  	"api_key" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "courses_phases" ALTER COLUMN "source_algorithm_id" SET DEFAULT 'general';
  ALTER TABLE "courses_phases" ALTER COLUMN "source_algorithm_id" DROP NOT NULL;
  ALTER TABLE "courses" ALTER COLUMN "mascot_enabled" SET DEFAULT false;
  ALTER TABLE "courses" ADD COLUMN "instructor_id" integer;
  ALTER TABLE "courses" ADD COLUMN "visibility" "enum_courses_visibility" DEFAULT 'public';
  ALTER TABLE "courses" ADD COLUMN "is_official" boolean DEFAULT false;
  ALTER TABLE "courses" ADD COLUMN "mascot_mode" "enum_courses_mascot_mode" DEFAULT 'disabled';
  ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "courses_instructor_idx" ON "courses" USING btree ("instructor_id");
  CREATE INDEX "learning_events_tab_idx" ON "learning_events" USING btree ("tab");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_settings" CASCADE;
  ALTER TABLE "courses" DROP CONSTRAINT "courses_instructor_id_users_id_fk";
  
  DROP INDEX "courses_instructor_idx";
  DROP INDEX "learning_events_tab_idx";
  ALTER TABLE "courses_phases" ALTER COLUMN "source_algorithm_id" DROP DEFAULT;
  ALTER TABLE "courses_phases" ALTER COLUMN "source_algorithm_id" SET NOT NULL;
  ALTER TABLE "courses" ALTER COLUMN "mascot_enabled" SET DEFAULT true;
  ALTER TABLE "courses" DROP COLUMN "instructor_id";
  ALTER TABLE "courses" DROP COLUMN "visibility";
  ALTER TABLE "courses" DROP COLUMN "is_official";
  ALTER TABLE "courses" DROP COLUMN "mascot_mode";
  DROP TYPE "public"."enum_courses_visibility";
  DROP TYPE "public"."enum_courses_mascot_mode";`)
}
