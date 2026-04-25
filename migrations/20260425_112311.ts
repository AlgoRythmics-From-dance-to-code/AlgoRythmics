import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_search_analytics_language" AS ENUM('en', 'hu', 'ro');
  ALTER TYPE "public"."enum_learning_events_tab" ADD VALUE 'order';
  ALTER TYPE "public"."enum_learning_events_tab" ADD VALUE 'match';
  ALTER TYPE "public"."enum_learning_events_tab" ADD VALUE 'gap-fill';
  ALTER TYPE "public"."enum_learning_events_tab" ADD VALUE 'debug';
  CREATE TABLE "search_analytics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"query" varchar NOT NULL,
  	"user_id" integer,
  	"results_count" numeric NOT NULL,
  	"language" "enum_search_analytics_language" NOT NULL,
  	"category" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "learning_events" ALTER COLUMN "algorithm_id" DROP NOT NULL;
  ALTER TABLE "learning_events" ALTER COLUMN "tab" DROP NOT NULL;
  ALTER TABLE "learning_events" ADD COLUMN "course_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_analytics_id" integer;
  ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "search_analytics_query_idx" ON "search_analytics" USING btree ("query");
  CREATE INDEX "search_analytics_user_idx" ON "search_analytics" USING btree ("user_id");
  CREATE INDEX "search_analytics_updated_at_idx" ON "search_analytics" USING btree ("updated_at");
  CREATE INDEX "search_analytics_created_at_idx" ON "search_analytics" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_analytics_fk" FOREIGN KEY ("search_analytics_id") REFERENCES "public"."search_analytics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "learning_events_course_id_idx" ON "learning_events" USING btree ("course_id");
  CREATE INDEX "payload_locked_documents_rels_search_analytics_id_idx" ON "payload_locked_documents_rels" USING btree ("search_analytics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_analytics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "search_analytics" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_search_analytics_fk";
  
  ALTER TABLE "learning_events" ALTER COLUMN "tab" SET DATA TYPE text;
  DROP TYPE "public"."enum_learning_events_tab";
  CREATE TYPE "public"."enum_learning_events_tab" AS ENUM('video', 'animation', 'control', 'create', 'alive');
  ALTER TABLE "learning_events" ALTER COLUMN "tab" SET DATA TYPE "public"."enum_learning_events_tab" USING "tab"::"public"."enum_learning_events_tab";
  DROP INDEX "learning_events_course_id_idx";
  DROP INDEX "payload_locked_documents_rels_search_analytics_id_idx";
  ALTER TABLE "learning_events" ALTER COLUMN "algorithm_id" SET NOT NULL;
  ALTER TABLE "learning_events" ALTER COLUMN "tab" SET NOT NULL;
  ALTER TABLE "learning_events" DROP COLUMN "course_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "search_analytics_id";
  DROP TYPE "public"."enum_search_analytics_language";`)
}
