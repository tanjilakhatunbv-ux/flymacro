import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "macros"
    ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "featured_order" numeric DEFAULT 100;
  `)

  await db.execute(sql`
    ALTER TABLE "_macros_v"
    ADD COLUMN IF NOT EXISTS "version_is_featured" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "version_featured_order" numeric DEFAULT 100;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "macros"
    DROP COLUMN IF EXISTS "is_featured",
    DROP COLUMN IF EXISTS "featured_order";
  `)

  await db.execute(sql`
    ALTER TABLE "_macros_v"
    DROP COLUMN IF EXISTS "version_is_featured",
    DROP COLUMN IF EXISTS "version_featured_order";
  `)
}
