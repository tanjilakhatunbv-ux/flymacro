import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create news enum for category
    CREATE TYPE "public"."enum_news_category" AS ENUM('addon-dev', 'tech-share', 'industry', 'version-update');

    -- Create news table
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

    -- Create news_rels for relationships (cover upload, body rich text blocks)
    CREATE TABLE IF NOT EXISTS "news_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "order" integer NOT NULL DEFAULT 0,
      "media_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- News indexes
    CREATE UNIQUE INDEX IF NOT EXISTS "news_slug_idx" ON "news" ("slug");
    CREATE INDEX IF NOT EXISTS "news_updated_at_idx" ON "news" ("updated_at");
    CREATE INDEX IF NOT EXISTS "news_created_at_idx" ON "news" ("created_at");

    -- News rels indexes and foreign keys
    CREATE INDEX IF NOT EXISTS "news_rels_parent_id_idx" ON "news_rels" ("parent_id");
    ALTER TABLE "news_rels" DROP CONSTRAINT IF EXISTS "news_rels_parent_id_fk";
    ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_parent_id_fk"
      FOREIGN KEY ("parent_id") REFERENCES "news"("id") ON DELETE cascade;
    ALTER TABLE "news_rels" DROP CONSTRAINT IF EXISTS "news_rels_media_id_fk";
    ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_media_id_fk"
      FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE set null;

    -- Add news_id to payload_locked_documents_rels
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "news_id" integer;

    -- Add foreign key for news_id
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_news_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_news_fk"
        FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE cascade;
      END IF;
    END $$;

    -- Create news draft versions table if versions are enabled
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
    ALTER TABLE "_news_v" DROP CONSTRAINT IF EXISTS "_news_v_parent_id_fk";
    ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_fk"
      FOREIGN KEY ("parent_id") REFERENCES "news"("id") ON DELETE cascade;

    -- Create _news_v_rels for version relationships
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
    ALTER TABLE "_news_v_rels" DROP CONSTRAINT IF EXISTS "_news_v_rels_parent_id_fk";
    ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_parent_id_fk"
      FOREIGN KEY ("parent_id") REFERENCES "_news_v"("id") ON DELETE cascade;
    ALTER TABLE "_news_v_rels" DROP CONSTRAINT IF EXISTS "_news_v_rels_media_id_fk";
    ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_media_id_fk"
      FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE set null;
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
