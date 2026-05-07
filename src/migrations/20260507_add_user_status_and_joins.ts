import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_users_status" AS ENUM('active', 'suspended', 'banned');

    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "enum_users_status" DEFAULT 'active' NOT NULL;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp(3) with time zone;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "login_count" numeric DEFAULT 0;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "staff_note" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "status";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "last_login_at";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "login_count";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "staff_note";

    DROP TYPE IF EXISTS "public"."enum_users_status";
  `)
}
