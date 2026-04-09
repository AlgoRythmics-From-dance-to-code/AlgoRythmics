import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  // Idempotent migration: only adds new columns if they don't already exist.
  // The courses/course_progress tables should already exist from previous migrations.

  // 1. Add max_points to courses_phases (if not already present)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'courses_phases' AND column_name = 'max_points'
      ) THEN
        ALTER TABLE "courses_phases" ADD COLUMN "max_points" numeric DEFAULT 10;
      END IF;
    END $$;
  `);

  // 2. Add phase_points to course_progress (if not already present)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'course_progress' AND column_name = 'phase_points'
      ) THEN
        ALTER TABLE "course_progress" ADD COLUMN "phase_points" jsonb;
      END IF;
    END $$;
  `);

  // 3. Update foreign keys to CASCADE for user-related tables
  await db.execute(sql`
    ALTER TABLE "learning_events" DROP CONSTRAINT IF EXISTS "learning_events_user_id_users_id_fk";
    ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

    ALTER TABLE "course_progress" DROP CONSTRAINT IF EXISTS "course_progress_user_id_users_id_fk";
    ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
  `);
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses_phases" DROP COLUMN IF EXISTS "max_points";
    ALTER TABLE "course_progress" DROP COLUMN IF EXISTS "phase_points";

    ALTER TABLE "learning_events" DROP CONSTRAINT IF EXISTS "learning_events_user_id_users_id_fk";
    ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");

    ALTER TABLE "course_progress" DROP CONSTRAINT IF EXISTS "course_progress_user_id_users_id_fk";
    ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");
  `);
}
