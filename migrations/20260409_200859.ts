import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "learning_events" DROP CONSTRAINT "learning_events_user_id_users_id_fk";
  
  ALTER TABLE "course_progress" DROP CONSTRAINT "course_progress_user_id_users_id_fk";
  
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_courses_started" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_courses_completed" numeric DEFAULT 0;
  ALTER TABLE "algorithm_progress" ADD COLUMN "control_total_time_ms" numeric DEFAULT 0;
  ALTER TABLE "algorithm_progress" ADD COLUMN "create_mistakes" numeric DEFAULT 0;
  ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "learning_events" DROP CONSTRAINT "learning_events_user_id_users_id_fk";
  
  ALTER TABLE "course_progress" DROP CONSTRAINT "course_progress_user_id_users_id_fk";
  
  ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_courses_started";
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_courses_completed";
  ALTER TABLE "algorithm_progress" DROP COLUMN "control_total_time_ms";
  ALTER TABLE "algorithm_progress" DROP COLUMN "create_mistakes";`)
}
