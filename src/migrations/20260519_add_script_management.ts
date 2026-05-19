import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_scripts_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_scripts_type" AS ENUM('macro', 'addon', 'tool', 'other');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_script_versions_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_script_versions_script_type" AS ENUM('macro', 'addon', 'tool', 'other');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__scripts_v_version_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__scripts_v_version_type" AS ENUM('macro', 'addon', 'tool', 'other');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__script_versions_v_version_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__script_versions_v_version_script_type" AS ENUM('macro', 'addon', 'tool', 'other');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "scripts" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "type" "enum_scripts_type" DEFAULT 'macro' NOT NULL,
      "summary" varchar,
      "description" jsonb,
      "author" varchar,
      "status" "enum_scripts_status" DEFAULT 'draft' NOT NULL,
      "published_at" timestamp(3) with time zone,
      "latest_version_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_scripts_status" DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS "_scripts_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_name" varchar,
      "version_slug" varchar,
      "version_type" "enum__scripts_v_version_type" DEFAULT 'macro',
      "version_summary" varchar,
      "version_description" jsonb,
      "version_author" varchar,
      "version_status" "enum__scripts_v_version_status" DEFAULT 'draft',
      "version_published_at" timestamp(3) with time zone,
      "version_latest_version_id" integer,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__scripts_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean,
      "autosave" boolean
    );

    CREATE TABLE IF NOT EXISTS "script_files" (
      "id" serial PRIMARY KEY NOT NULL,
      "description" varchar,
      "prefix" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric
    );

    CREATE TABLE IF NOT EXISTS "script_versions" (
      "id" serial PRIMARY KEY NOT NULL,
      "script_id" integer,
      "version" varchar NOT NULL,
      "script_file_id" integer,
      "script_type" "enum_script_versions_script_type" DEFAULT 'macro' NOT NULL,
      "game_version_id" integer,
      "changelog" varchar,
      "description" jsonb,
      "author" varchar,
      "checksum" varchar,
      "status" "enum_script_versions_status" DEFAULT 'draft' NOT NULL,
      "published_at" timestamp(3) with time zone,
      "is_latest" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_script_versions_status" DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS "_script_versions_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_script_id" integer,
      "version_version" varchar,
      "version_script_file_id" integer,
      "version_script_type" "enum__script_versions_v_version_script_type" DEFAULT 'macro',
      "version_game_version_id" integer,
      "version_changelog" varchar,
      "version_description" jsonb,
      "version_author" varchar,
      "version_checksum" varchar,
      "version_status" "enum__script_versions_v_version_status" DEFAULT 'draft',
      "version_published_at" timestamp(3) with time zone,
      "version_is_latest" boolean DEFAULT false,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__script_versions_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean,
      "autosave" boolean
    );

    DO $$ BEGIN
      ALTER TABLE "scripts" ADD CONSTRAINT "scripts_slug_unique" UNIQUE("slug");
    EXCEPTION WHEN duplicate_table THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "scripts" ADD CONSTRAINT "scripts_latest_version_id_script_versions_id_fk"
        FOREIGN KEY ("latest_version_id") REFERENCES "public"."script_versions"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "script_versions" ADD CONSTRAINT "script_versions_script_id_scripts_id_fk"
        FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "script_versions" ADD CONSTRAINT "script_versions_script_file_id_script_files_id_fk"
        FOREIGN KEY ("script_file_id") REFERENCES "public"."script_files"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "script_versions" ADD CONSTRAINT "script_versions_game_version_id_versions_id_fk"
        FOREIGN KEY ("game_version_id") REFERENCES "public"."versions"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "scripts_slug_idx" ON "scripts" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "script_versions_script_idx" ON "script_versions" USING btree ("script_id");
    CREATE INDEX IF NOT EXISTS "script_versions_status_idx" ON "script_versions" USING btree ("status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "scripts" DROP CONSTRAINT IF EXISTS "scripts_latest_version_id_script_versions_id_fk";
    ALTER TABLE IF EXISTS "script_versions" DROP CONSTRAINT IF EXISTS "script_versions_script_id_scripts_id_fk";
    ALTER TABLE IF EXISTS "script_versions" DROP CONSTRAINT IF EXISTS "script_versions_script_file_id_script_files_id_fk";
    ALTER TABLE IF EXISTS "script_versions" DROP CONSTRAINT IF EXISTS "script_versions_game_version_id_versions_id_fk";
    ALTER TABLE IF EXISTS "scripts" DROP CONSTRAINT IF EXISTS "scripts_slug_unique";

    DROP TABLE IF EXISTS "_script_versions_v";
    DROP TABLE IF EXISTS "script_versions";
    DROP TABLE IF EXISTS "_scripts_v";
    DROP TABLE IF EXISTS "scripts";
    DROP TABLE IF EXISTS "script_files";

    DROP TYPE IF EXISTS "public"."enum_scripts_status";
    DROP TYPE IF EXISTS "public"."enum_scripts_type";
    DROP TYPE IF EXISTS "public"."enum_script_versions_status";
    DROP TYPE IF EXISTS "public"."enum_script_versions_script_type";
    DROP TYPE IF EXISTS "public"."enum__scripts_v_version_status";
    DROP TYPE IF EXISTS "public"."enum__scripts_v_version_type";
    DROP TYPE IF EXISTS "public"."enum__script_versions_v_version_status";
    DROP TYPE IF EXISTS "public"."enum__script_versions_v_version_script_type";
  `)
}
