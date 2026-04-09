import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('hu', 'en', 'ro');
  CREATE TYPE "public"."enum_courses_phases_source_view" AS ENUM('video', 'video-custom', 'animation', 'control', 'create', 'alive', 'quiz', 'match', 'order', 'debug', 'gap-fill', 'info', 'final-challenge');
  CREATE TYPE "public"."enum_courses_difficulty" AS ENUM('Beginner', 'Intermediate', 'Advanced');
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'editor' BEFORE 'user';
  CREATE TABLE "courses_mascot_welcome_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_mascot_welcome_messages_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_mascot_overconfident_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_mascot_overconfident_messages_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_mascot_streak_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_mascot_streak_messages_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_phases_quiz_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_phases_quiz_options_locales" (
  	"option" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_phases_quiz" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"correct_index" numeric
  );
  
  CREATE TABLE "courses_phases_quiz_locales" (
  	"question" varchar,
  	"explanation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_phases_matching" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_phases_matching_locales" (
  	"left" varchar,
  	"right" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_phases_ordering" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_phases_ordering_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_phases_gap_fill_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_phases_gap_fill_options_locales" (
  	"option" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_phases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"phase_id" varchar NOT NULL,
  	"source_algorithm_id" varchar NOT NULL,
  	"source_view" "enum_courses_phases_source_view" NOT NULL,
  	"ask_confidence" boolean DEFAULT false,
  	"max_points" numeric DEFAULT 10,
  	"custom_video_id" varchar,
  	"debug_code" varchar,
  	"expected_code" varchar
  );
  
  CREATE TABLE "courses_phases_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"mascot_line" varchar,
  	"mascot_mistake_line" varchar,
  	"hint_copy" varchar,
  	"idle_help" varchar,
  	"info_content" varchar,
  	"gap_fill_content" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"icon" varchar DEFAULT '📘',
  	"accent_color" varchar DEFAULT '#269984',
  	"illustration_asset" varchar DEFAULT 'algo_group_109.svg',
  	"estimated_minutes" numeric NOT NULL,
  	"difficulty" "enum_courses_difficulty" DEFAULT 'Beginner' NOT NULL,
  	"mascot_enabled" boolean DEFAULT true,
  	"mascot_asset" varchar DEFAULT 'algo_group_109.svg',
  	"mascot_accent_color" varchar DEFAULT '#269984',
  	"mascot_idle_trigger_seconds" numeric DEFAULT 30,
  	"mascot_mistake_trigger_count" numeric DEFAULT 2,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courses_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"hero_tagline" varchar,
  	"mascot_name" varchar DEFAULT 'Guide' NOT NULL,
  	"mascot_summon_label" varchar DEFAULT 'Summon guide',
  	"mascot_idle_prompt" varchar,
  	"mascot_mistake_prompt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer
  );
  
  CREATE TABLE "course_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"course_id" varchar NOT NULL,
  	"active_phase_index" numeric DEFAULT 0,
  	"last_confidence_rating" varchar,
  	"phase_results" jsonb,
  	"points" numeric DEFAULT 0,
  	"is_completed" boolean DEFAULT false,
  	"total_time_ms" numeric DEFAULT 0,
  	"total_mistakes" numeric DEFAULT 0,
  	"mascot_interactions_total" numeric DEFAULT 0,
  	"confidence_results" jsonb,
  	"first_started_at" timestamp(3) with time zone,
  	"last_activity_at" timestamp(3) with time zone,
  	"detailed_stats" jsonb,
  	"phase_points" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "course_progress_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "users" ADD COLUMN "mascot_enabled" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "courses_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "course_progress_id" integer;
  ALTER TABLE "courses_mascot_welcome_messages" ADD CONSTRAINT "courses_mascot_welcome_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_mascot_welcome_messages_locales" ADD CONSTRAINT "courses_mascot_welcome_messages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_mascot_welcome_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_mascot_overconfident_messages" ADD CONSTRAINT "courses_mascot_overconfident_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_mascot_overconfident_messages_locales" ADD CONSTRAINT "courses_mascot_overconfident_messages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_mascot_overconfident_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_mascot_streak_messages" ADD CONSTRAINT "courses_mascot_streak_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_mascot_streak_messages_locales" ADD CONSTRAINT "courses_mascot_streak_messages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_mascot_streak_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_quiz_options" ADD CONSTRAINT "courses_phases_quiz_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases_quiz"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_quiz_options_locales" ADD CONSTRAINT "courses_phases_quiz_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases_quiz_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_quiz" ADD CONSTRAINT "courses_phases_quiz_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_quiz_locales" ADD CONSTRAINT "courses_phases_quiz_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases_quiz"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_matching" ADD CONSTRAINT "courses_phases_matching_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_matching_locales" ADD CONSTRAINT "courses_phases_matching_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases_matching"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_ordering" ADD CONSTRAINT "courses_phases_ordering_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_ordering_locales" ADD CONSTRAINT "courses_phases_ordering_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases_ordering"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_gap_fill_options" ADD CONSTRAINT "courses_phases_gap_fill_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_gap_fill_options_locales" ADD CONSTRAINT "courses_phases_gap_fill_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases_gap_fill_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases" ADD CONSTRAINT "courses_phases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_locales" ADD CONSTRAINT "courses_phases_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_locales" ADD CONSTRAINT "courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_progress_texts" ADD CONSTRAINT "course_progress_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."course_progress"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_mascot_welcome_messages_order_idx" ON "courses_mascot_welcome_messages" USING btree ("_order");
  CREATE INDEX "courses_mascot_welcome_messages_parent_id_idx" ON "courses_mascot_welcome_messages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_mascot_welcome_messages_locales_locale_parent_id_uni" ON "courses_mascot_welcome_messages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_mascot_overconfident_messages_order_idx" ON "courses_mascot_overconfident_messages" USING btree ("_order");
  CREATE INDEX "courses_mascot_overconfident_messages_parent_id_idx" ON "courses_mascot_overconfident_messages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_mascot_overconfident_messages_locales_locale_parent_" ON "courses_mascot_overconfident_messages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_mascot_streak_messages_order_idx" ON "courses_mascot_streak_messages" USING btree ("_order");
  CREATE INDEX "courses_mascot_streak_messages_parent_id_idx" ON "courses_mascot_streak_messages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_mascot_streak_messages_locales_locale_parent_id_uniq" ON "courses_mascot_streak_messages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_phases_quiz_options_order_idx" ON "courses_phases_quiz_options" USING btree ("_order");
  CREATE INDEX "courses_phases_quiz_options_parent_id_idx" ON "courses_phases_quiz_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_phases_quiz_options_locales_locale_parent_id_unique" ON "courses_phases_quiz_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_phases_quiz_order_idx" ON "courses_phases_quiz" USING btree ("_order");
  CREATE INDEX "courses_phases_quiz_parent_id_idx" ON "courses_phases_quiz" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_phases_quiz_locales_locale_parent_id_unique" ON "courses_phases_quiz_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_phases_matching_order_idx" ON "courses_phases_matching" USING btree ("_order");
  CREATE INDEX "courses_phases_matching_parent_id_idx" ON "courses_phases_matching" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_phases_matching_locales_locale_parent_id_unique" ON "courses_phases_matching_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_phases_ordering_order_idx" ON "courses_phases_ordering" USING btree ("_order");
  CREATE INDEX "courses_phases_ordering_parent_id_idx" ON "courses_phases_ordering" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_phases_ordering_locales_locale_parent_id_unique" ON "courses_phases_ordering_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_phases_gap_fill_options_order_idx" ON "courses_phases_gap_fill_options" USING btree ("_order");
  CREATE INDEX "courses_phases_gap_fill_options_parent_id_idx" ON "courses_phases_gap_fill_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_phases_gap_fill_options_locales_locale_parent_id_uni" ON "courses_phases_gap_fill_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_phases_order_idx" ON "courses_phases" USING btree ("_order");
  CREATE INDEX "courses_phases_parent_id_idx" ON "courses_phases" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_phases_locales_locale_parent_id_unique" ON "courses_phases_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE UNIQUE INDEX "courses_title_idx" ON "courses_locales" USING btree ("title","_locale");
  CREATE UNIQUE INDEX "courses_locales_locale_parent_id_unique" ON "courses_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_courses_id_idx" ON "users_rels" USING btree ("courses_id");
  CREATE INDEX "course_progress_user_idx" ON "course_progress" USING btree ("user_id");
  CREATE INDEX "course_progress_course_id_idx" ON "course_progress" USING btree ("course_id");
  CREATE INDEX "course_progress_updated_at_idx" ON "course_progress" USING btree ("updated_at");
  CREATE INDEX "course_progress_created_at_idx" ON "course_progress" USING btree ("created_at");
  CREATE INDEX "course_progress_texts_order_parent" ON "course_progress_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_progress_fk" FOREIGN KEY ("course_progress_id") REFERENCES "public"."course_progress"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_course_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("course_progress_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses_mascot_welcome_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_mascot_welcome_messages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_mascot_overconfident_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_mascot_overconfident_messages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_mascot_streak_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_mascot_streak_messages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_quiz_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_quiz_options_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_quiz" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_quiz_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_matching" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_matching_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_ordering" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_ordering_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_gap_fill_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_gap_fill_options_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_phases_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_progress" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_progress_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "courses_mascot_welcome_messages" CASCADE;
  DROP TABLE "courses_mascot_welcome_messages_locales" CASCADE;
  DROP TABLE "courses_mascot_overconfident_messages" CASCADE;
  DROP TABLE "courses_mascot_overconfident_messages_locales" CASCADE;
  DROP TABLE "courses_mascot_streak_messages" CASCADE;
  DROP TABLE "courses_mascot_streak_messages_locales" CASCADE;
  DROP TABLE "courses_phases_quiz_options" CASCADE;
  DROP TABLE "courses_phases_quiz_options_locales" CASCADE;
  DROP TABLE "courses_phases_quiz" CASCADE;
  DROP TABLE "courses_phases_quiz_locales" CASCADE;
  DROP TABLE "courses_phases_matching" CASCADE;
  DROP TABLE "courses_phases_matching_locales" CASCADE;
  DROP TABLE "courses_phases_ordering" CASCADE;
  DROP TABLE "courses_phases_ordering_locales" CASCADE;
  DROP TABLE "courses_phases_gap_fill_options" CASCADE;
  DROP TABLE "courses_phases_gap_fill_options_locales" CASCADE;
  DROP TABLE "courses_phases" CASCADE;
  DROP TABLE "courses_phases_locales" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_locales" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "course_progress" CASCADE;
  DROP TABLE "course_progress_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_courses_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_course_progress_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'user');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "payload_locked_documents_rels_courses_id_idx";
  DROP INDEX "payload_locked_documents_rels_course_progress_id_idx";
  ALTER TABLE "users" DROP COLUMN "mascot_enabled";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "courses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "course_progress_id";
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_courses_phases_source_view";
  DROP TYPE "public"."enum_courses_difficulty";`)
}
