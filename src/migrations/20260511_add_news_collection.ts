import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // The news table was likely already created by Payload dev mode auto-push.
  // This migration ensures the schema is complete and adds the missing
  // news_id column to payload_locked_documents_rels.

  // Create enum if not exists
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_news_category" AS ENUM('addon-dev', 'tech-share', 'industry', 'version-update');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "news" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "summary" varchar,
      "category" "enum_news_category",
      "author" varchar,
      "pinned" boolean DEFAULT false,
      "published_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "news_slug_idx" ON "news" ("slug");
    CREATE INDEX IF NOT EXISTS "news_updated_at_idx" ON "news" ("updated_at");
    CREATE INDEX IF NOT EXISTS "news_created_at_idx" ON "news" ("created_at");
  `)

  // news_rels - created without media_id FK to avoid issues if table already exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "news_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "order" integer NOT NULL DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "news_rels_parent_id_idx" ON "news_rels" ("parent_id");
  `)

  // Add media_id column if not exists
  await db.execute(sql`
    ALTER TABLE "news_rels" ADD COLUMN IF NOT EXISTS "media_id" integer;
  `)

  // Add foreign keys safely
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "news"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_media_id_fk"
        FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
    END $$;

    -- Add news_id to payload_locked_documents_rels
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "news_id" integer;

    -- Add foreign key for news_id
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_news_fk"
        FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  // Version tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_news_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "slug" varchar,
      "summary" varchar,
      "category" "enum_news_category",
      "author" varchar,
      "pinned" boolean,
      "published_at" timestamp(3) with time zone,
      "parent_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "_news_v_parent_id_idx" ON "_news_v" ("parent_id");

    DO $$ BEGIN
      ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "news"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "_news_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "order" integer NOT NULL DEFAULT 0,
      "media_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "_news_v_rels_parent_id_idx" ON "_news_v_rels" ("parent_id");

    DO $$ BEGIN
      ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "_news_v"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_news_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "news_id";

    DROP TABLE IF EXISTS "_news_v_rels";
    DROP TABLE IF EXISTS "_news_v";
    DROP TABLE IF EXISTS "news_rels";
    DROP TABLE IF EXISTS "news";
    DROP TYPE IF EXISTS "public"."enum_news_category";
  `)
}
