import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_learning_events_tab" AS ENUM('video', 'animation', 'control', 'create', 'alive');
  CREATE TABLE "learning_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"algorithm_id" varchar NOT NULL,
  	"tab" "enum_learning_events_tab" NOT NULL,
  	"event_type" varchar NOT NULL,
  	"event_data" jsonb,
  	"session_id" varchar NOT NULL,
  	"duration_ms" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "algorithm_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"algorithm_id" varchar NOT NULL,
  	"video_watched" boolean DEFAULT false,
  	"video_watch_time_ms" numeric DEFAULT 0,
  	"video_completed_at" timestamp(3) with time zone,
  	"animation_completed" boolean DEFAULT false,
  	"animation_total_time_ms" numeric DEFAULT 0,
  	"animation_play_count" numeric DEFAULT 0,
  	"animation_completed_at" timestamp(3) with time zone,
  	"control_completed" boolean DEFAULT false,
  	"control_best_score" numeric DEFAULT 0,
  	"control_mistakes" numeric DEFAULT 0,
  	"control_hints_used" numeric DEFAULT 0,
  	"control_attempts" numeric DEFAULT 0,
  	"control_best_time_ms" numeric DEFAULT 0,
  	"control_completed_at" timestamp(3) with time zone,
  	"create_completed" boolean DEFAULT false,
  	"create_help_used" boolean DEFAULT false,
  	"create_attempts" numeric DEFAULT 0,
  	"create_blanks_correct_first" numeric DEFAULT 0,
  	"create_blanks_total" numeric DEFAULT 0,
  	"create_total_time_ms" numeric DEFAULT 0,
  	"create_completed_at" timestamp(3) with time zone,
  	"alive_completed" boolean DEFAULT false,
  	"alive_help_used" boolean DEFAULT false,
  	"alive_code_submissions" numeric DEFAULT 0,
  	"alive_last_code" varchar,
  	"alive_best_score" numeric DEFAULT 0,
  	"alive_total_time_ms" numeric DEFAULT 0,
  	"alive_completed_at" timestamp(3) with time zone,
  	"overall_progress" numeric DEFAULT 0,
  	"total_time_spent_ms" numeric DEFAULT 0,
  	"last_activity_at" timestamp(3) with time zone,
  	"first_started_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_time_spent_ms" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_algorithms_started" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_algorithms_completed" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_control_attempts" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_create_attempts" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_alive_attempts" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_mistakes" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_hints_used" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_average_score" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_current_streak" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_longest_streak" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_last_active_date" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "learning_stats_preferred_speed" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "algorithm_progress_id" integer;
  ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "algorithm_progress" ADD CONSTRAINT "algorithm_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "learning_events_user_idx" ON "learning_events" USING btree ("user_id");
  CREATE INDEX "learning_events_algorithm_id_idx" ON "learning_events" USING btree ("algorithm_id");
  CREATE INDEX "learning_events_event_type_idx" ON "learning_events" USING btree ("event_type");
  CREATE INDEX "learning_events_session_id_idx" ON "learning_events" USING btree ("session_id");
  CREATE INDEX "learning_events_updated_at_idx" ON "learning_events" USING btree ("updated_at");
  CREATE INDEX "learning_events_created_at_idx" ON "learning_events" USING btree ("created_at");
  CREATE INDEX "algorithm_progress_user_idx" ON "algorithm_progress" USING btree ("user_id");
  CREATE INDEX "algorithm_progress_algorithm_id_idx" ON "algorithm_progress" USING btree ("algorithm_id");
  CREATE INDEX "algorithm_progress_updated_at_idx" ON "algorithm_progress" USING btree ("updated_at");
  CREATE INDEX "algorithm_progress_created_at_idx" ON "algorithm_progress" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_learning_events_fk" FOREIGN KEY ("learning_events_id") REFERENCES "public"."learning_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_algorithm_progress_fk" FOREIGN KEY ("algorithm_progress_id") REFERENCES "public"."algorithm_progress"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_learning_events_id_idx" ON "payload_locked_documents_rels" USING btree ("learning_events_id");
  CREATE INDEX "payload_locked_documents_rels_algorithm_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("algorithm_progress_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "learning_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "algorithm_progress" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "learning_events" CASCADE;
  DROP TABLE "algorithm_progress" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_learning_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_algorithm_progress_fk";
  
  DROP INDEX "payload_locked_documents_rels_learning_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_algorithm_progress_id_idx";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_time_spent_ms";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_algorithms_started";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_algorithms_completed";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_control_attempts";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_create_attempts";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_alive_attempts";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_mistakes";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_hints_used";
  ALTER TABLE "users" DROP COLUMN "learning_stats_average_score";
  ALTER TABLE "users" DROP COLUMN "learning_stats_current_streak";
  ALTER TABLE "users" DROP COLUMN "learning_stats_longest_streak";
  ALTER TABLE "users" DROP COLUMN "learning_stats_last_active_date";
  ALTER TABLE "users" DROP COLUMN "learning_stats_preferred_speed";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "algorithm_progress_id";
  DROP TYPE "public"."enum_learning_events_tab";`)
}
