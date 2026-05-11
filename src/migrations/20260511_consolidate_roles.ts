import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Consolidate roles: super-admin → admin, support → operator
  // The column may already be text from a partially-failed previous run.

  // 1. Convert role column to text if it's still an enum
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING "role"::text;
  `)

  // 2. Update role values
  await db.execute(sql`
    UPDATE "users" SET "role" = 'admin' WHERE "role" = 'super-admin';
    UPDATE "users" SET "role" = 'operator' WHERE "role" = 'support';
  `)

  // 3. Drop old enum and create new one
  await db.execute(sql`
    DROP TYPE IF EXISTS "enum_users_role" CASCADE;
    CREATE TYPE "enum_users_role" AS ENUM('admin', 'operator', 'user');
  `)

  // 4. Convert column back to new enum
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_users_role" USING "role"::"enum_users_role";
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING "role"::text;
  `)

  await db.execute(sql`
    UPDATE "users" SET "role" = 'super-admin' WHERE "role" = 'admin';
    UPDATE "users" SET "role" = 'support' WHERE "role" = 'operator';
  `)

  await db.execute(sql`
    DROP TYPE IF EXISTS "enum_users_role" CASCADE;
    CREATE TYPE "enum_users_role" AS ENUM('super-admin', 'operator', 'support', 'user');
  `)

  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_users_role" USING "role"::"enum_users_role";
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
  `)
}
