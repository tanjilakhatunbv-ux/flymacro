import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add missing og image size columns to media table
  await db.execute(sql.raw(`ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_url" varchar;`))
  await db.execute(sql.raw(`ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_width" numeric;`))
  await db.execute(sql.raw(`ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_height" numeric;`))
  await db.execute(sql.raw(`ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_mime_type" varchar;`))
  await db.execute(sql.raw(`ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_filesize" numeric;`))
  await db.execute(sql.raw(`ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_filename" varchar;`))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_url";`))
  await db.execute(sql.raw(`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_width";`))
  await db.execute(sql.raw(`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_height";`))
  await db.execute(sql.raw(`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_mime_type";`))
  await db.execute(sql.raw(`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_filesize";`))
  await db.execute(sql.raw(`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_filename";`))
}
