import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_plugin_releases_delivery_mode" AS ENUM('file', 'link');

    CREATE TABLE "plugin_files" (
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

    CREATE TABLE "plugin_releases" (
      "id" serial PRIMARY KEY NOT NULL,
      "version" varchar NOT NULL,
      "changelog" varchar,
      "published_at" timestamp(3) with time zone NOT NULL,
      "is_published" boolean DEFAULT false,
      "delivery_mode" "enum_plugin_releases_delivery_mode" DEFAULT 'file' NOT NULL,
      "plugin_file_id" integer,
      "cloud_url" varchar,
      "cloud_password" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "plugin_releases" ADD CONSTRAINT "plugin_releases_plugin_file_id_plugin_files_id_fk"
      FOREIGN KEY ("plugin_file_id") REFERENCES "public"."plugin_files"("id")
      ON DELETE set null ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "plugin_releases" DROP CONSTRAINT IF EXISTS "plugin_releases_plugin_file_id_plugin_files_id_fk";
    DROP TABLE IF EXISTS "plugin_releases";
    DROP TABLE IF EXISTS "plugin_files";
    DROP TYPE IF EXISTS "public"."enum_plugin_releases_delivery_mode";
  `)
}
