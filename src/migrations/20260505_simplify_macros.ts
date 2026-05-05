import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Create new enum types
  await db.execute(sql`
    CREATE TYPE "public"."enum_macros_tier" AS ENUM('regular', 'premium');
    CREATE TYPE "public"."enum__macros_v_version_tier" AS ENUM('regular', 'premium');
  `)

  // Add new columns to macros table
  await db.execute(sql`
    ALTER TABLE "macros"
    ADD COLUMN "tier" "enum_macros_tier" DEFAULT 'regular',
    ADD COLUMN "price" numeric DEFAULT 5,
    ADD COLUMN "duration_days" numeric DEFAULT 0,
    ADD COLUMN "auto_renewable" boolean DEFAULT true;
  `)

  // Add new columns to _macros_v version table
  await db.execute(sql`
    ALTER TABLE "_macros_v"
    ADD COLUMN "version_tier" "enum__macros_v_version_tier" DEFAULT 'regular',
    ADD COLUMN "version_price" numeric DEFAULT 5,
    ADD COLUMN "version_duration_days" numeric DEFAULT 0,
    ADD COLUMN "version_auto_renewable" boolean DEFAULT true;
  `)

  // Drop old type columns
  await db.execute(sql`
    ALTER TABLE "macros" DROP COLUMN IF EXISTS "type";
    ALTER TABLE "_macros_v" DROP COLUMN IF EXISTS "version_type";
  `)

  // Drop model_name from macro_exchanges
  await db.execute(sql`
    ALTER TABLE "macro_exchanges" DROP COLUMN IF EXISTS "model_name";
  `)

  // Drop old model-related tables (no longer used)
  await db.execute(sql`
    DROP TABLE IF EXISTS "macros_models_features" CASCADE;
    DROP TABLE IF EXISTS "macros_models" CASCADE;
    DROP TABLE IF EXISTS "_macros_v_version_models_features" CASCADE;
    DROP TABLE IF EXISTS "_macros_v_version_models" CASCADE;
  `)

  // Drop old enum types
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_macros_type" CASCADE;
    DROP TYPE IF EXISTS "public"."enum__macros_v_version_type" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_macros_models_tier" CASCADE;
    DROP TYPE IF EXISTS "public"."enum__macros_v_version_models_tier" CASCADE;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Recreate old enum types
  await db.execute(sql`
    CREATE TYPE "public"."enum_macros_type" AS ENUM('free', 'premium');
    CREATE TYPE "public"."enum__macros_v_version_type" AS ENUM('free', 'premium');
    CREATE TYPE "public"."enum_macros_models_tier" AS ENUM('regular', 'premium');
    CREATE TYPE "public"."enum__macros_v_version_models_tier" AS ENUM('regular', 'premium');
  `)

  // Add back old columns
  await db.execute(sql`
    ALTER TABLE "macros"
    ADD COLUMN "type" "enum_macros_type" DEFAULT 'free';

    ALTER TABLE "_macros_v"
    ADD COLUMN "version_type" "enum__macros_v_version_type" DEFAULT 'free';

    ALTER TABLE "macro_exchanges"
    ADD COLUMN "model_name" varchar;
  `)

  // Drop new columns
  await db.execute(sql`
    ALTER TABLE "macros" DROP COLUMN IF EXISTS "tier";
    ALTER TABLE "macros" DROP COLUMN IF EXISTS "price";
    ALTER TABLE "macros" DROP COLUMN IF EXISTS "duration_days";
    ALTER TABLE "macros" DROP COLUMN IF EXISTS "auto_renewable";

    ALTER TABLE "_macros_v" DROP COLUMN IF EXISTS "version_tier";
    ALTER TABLE "_macros_v" DROP COLUMN IF EXISTS "version_price";
    ALTER TABLE "_macros_v" DROP COLUMN IF EXISTS "version_duration_days";
    ALTER TABLE "_macros_v" DROP COLUMN IF EXISTS "version_auto_renewable";
  `)

  // Recreate old model tables (simplified - just the tables, not full constraints)
  await db.execute(sql`
    CREATE TABLE "macros_models" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar,
      "price" numeric,
      "tier" "enum_macros_models_tier" DEFAULT 'regular',
      "duration_days" numeric DEFAULT 0,
      "auto_renewable" boolean DEFAULT true,
      "sort" numeric DEFAULT 0
    );

    CREATE TABLE "macros_models_features" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" varchar,
      "_uuid" varchar
    );

    CREATE TABLE "_macros_v_version_models" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "price" numeric,
      "tier" "enum__macros_v_version_models_tier" DEFAULT 'regular',
      "duration_days" numeric DEFAULT 0,
      "auto_renewable" boolean DEFAULT true
    );

    CREATE TABLE "_macros_v_version_models_features" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" varchar,
      "_uuid" varchar
    );
  `)

  // Drop new enum types
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_macros_tier" CASCADE;
    DROP TYPE IF EXISTS "public"."enum__macros_v_version_tier" CASCADE;
  `)
}
