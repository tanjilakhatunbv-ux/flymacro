import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add prefix column to media table (required by s3Storage plugin)
  await db.execute(sql.raw(
    `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "prefix" varchar;`
  ))

  // Add prefix column to plugin_files table (required by s3Storage plugin)
  // Note: PayloadCMS slug "plugin-files" becomes PostgreSQL table name "plugin_files"
  await db.execute(sql.raw(
    `ALTER TABLE "plugin_files" ADD COLUMN IF NOT EXISTS "prefix" varchar;`
  ))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(
    `ALTER TABLE "media" DROP COLUMN IF EXISTS "prefix";`
  ))
  await db.execute(sql.raw(
    `ALTER TABLE "plugin_files" DROP COLUMN IF EXISTS "prefix";`
  ))
}
