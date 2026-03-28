import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_completed_algorithms" AS ENUM('bubble-sort', 'insertion-sort', 'selection-sort', 'shell-sort', 'merge-sort', 'quick-sort', 'heap-sort', 'linear-search', 'binary-search', 'n-queens', 'bogosort');
  CREATE TABLE "users_completed_algorithms" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_completed_algorithms",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "visualizer_progress" jsonb;
  ALTER TABLE "users_completed_algorithms" ADD CONSTRAINT "users_completed_algorithms_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_completed_algorithms_order_idx" ON "users_completed_algorithms" USING btree ("order");
  CREATE INDEX "users_completed_algorithms_parent_idx" ON "users_completed_algorithms" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_completed_algorithms" CASCADE;
  ALTER TABLE "users" DROP COLUMN "visualizer_progress";
  DROP TYPE "public"."enum_users_completed_algorithms";`)
}
