import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "courses_phases_gap_fill_solutions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_phases_gap_fill_solutions_locales" (
  	"solution" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "learning_stats_total_points" numeric DEFAULT 0;
  ALTER TABLE "courses_phases_gap_fill_solutions" ADD CONSTRAINT "courses_phases_gap_fill_solutions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_phases_gap_fill_solutions_locales" ADD CONSTRAINT "courses_phases_gap_fill_solutions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_phases_gap_fill_solutions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_phases_gap_fill_solutions_order_idx" ON "courses_phases_gap_fill_solutions" USING btree ("_order");
  CREATE INDEX "courses_phases_gap_fill_solutions_parent_id_idx" ON "courses_phases_gap_fill_solutions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_phases_gap_fill_solutions_locales_locale_parent_id_u" ON "courses_phases_gap_fill_solutions_locales" USING btree ("_locale","_parent_id");`);
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "courses_phases_gap_fill_solutions" CASCADE;
  DROP TABLE "courses_phases_gap_fill_solutions_locales" CASCADE;
  ALTER TABLE "users" DROP COLUMN "learning_stats_total_points";`);
}
