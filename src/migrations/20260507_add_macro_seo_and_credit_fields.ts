import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Macros: preview / video / SEO fields
  await db.execute(sql`
    ALTER TABLE "macros"
    ADD COLUMN IF NOT EXISTS "preview_img_id" integer,
    ADD COLUMN IF NOT EXISTS "demo_video_url" varchar,
    ADD COLUMN IF NOT EXISTS "seo_seo_title" varchar,
    ADD COLUMN IF NOT EXISTS "seo_seo_description" varchar,
    ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;
  `)

  await db.execute(sql`
    ALTER TABLE "_macros_v"
    ADD COLUMN IF NOT EXISTS "version_preview_img_id" integer,
    ADD COLUMN IF NOT EXISTS "version_demo_video_url" varchar,
    ADD COLUMN IF NOT EXISTS "version_seo_seo_title" varchar,
    ADD COLUMN IF NOT EXISTS "version_seo_seo_description" varchar,
    ADD COLUMN IF NOT EXISTS "version_seo_og_image_id" integer;
  `)

  // CreditPackages: original amount / discount / badge
  await db.execute(sql`
    ALTER TABLE "credit_packages"
    ADD COLUMN IF NOT EXISTS "original_amount" numeric,
    ADD COLUMN IF NOT EXISTS "discount_label" varchar,
    ADD COLUMN IF NOT EXISTS "badge" varchar DEFAULT 'none';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "macros"
    DROP COLUMN IF EXISTS "preview_img_id",
    DROP COLUMN IF EXISTS "demo_video_url",
    DROP COLUMN IF EXISTS "seo_seo_title",
    DROP COLUMN IF EXISTS "seo_seo_description",
    DROP COLUMN IF EXISTS "seo_og_image_id";
  `)

  await db.execute(sql`
    ALTER TABLE "_macros_v"
    DROP COLUMN IF EXISTS "version_preview_img_id",
    DROP COLUMN IF EXISTS "version_demo_video_url",
    DROP COLUMN IF EXISTS "version_seo_seo_title",
    DROP COLUMN IF EXISTS "version_seo_seo_description",
    DROP COLUMN IF EXISTS "version_seo_og_image_id";
  `)

  await db.execute(sql`
    ALTER TABLE "credit_packages"
    DROP COLUMN IF EXISTS "original_amount",
    DROP COLUMN IF EXISTS "discount_label",
    DROP COLUMN IF EXISTS "badge";
  `)
}
