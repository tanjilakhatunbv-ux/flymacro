import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Relax NOT NULL constraints on user-defined required fields so that
 * Payload's versions/drafts system can create initial empty draft rows
 * on the admin "create" page.
 *
 * Before this migration, the admin create page for news, scripts, and
 * script-versions showed a blank form because Payload's automatic draft
 * creation failed with "null value in column X violates not-null constraint".
 *
 * Payload validates required fields at the application level, so removing
 * the database-level NOT NULL is safe — it just lets the draft flow work.
 * The working collections (macros, guides, articles, pages) already have
 * nullable columns for their required fields.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const sql = payload.db.drizzle

  // --- news ---
  await sql`ALTER TABLE news ALTER COLUMN title DROP NOT NULL`
  await sql`ALTER TABLE news ALTER COLUMN slug DROP NOT NULL`

  // --- scripts ---
  await sql`ALTER TABLE scripts ALTER COLUMN name DROP NOT NULL`
  await sql`ALTER TABLE scripts ALTER COLUMN slug DROP NOT NULL`
  await sql`ALTER TABLE scripts ALTER COLUMN type DROP NOT NULL`
  await sql`ALTER TABLE scripts ALTER COLUMN status DROP NOT NULL`

  // --- script_versions ---
  await sql`ALTER TABLE script_versions ALTER COLUMN version DROP NOT NULL`
  await sql`ALTER TABLE script_versions ALTER COLUMN script_type DROP NOT NULL`
  await sql`ALTER TABLE script_versions ALTER COLUMN status DROP NOT NULL`
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  const sql = payload.db.drizzle

  // Re-add NOT NULL constraints (only safe if no NULL rows exist)
  await sql`ALTER TABLE news ALTER COLUMN title SET NOT NULL`
  await sql`ALTER TABLE news ALTER COLUMN slug SET NOT NULL`

  await sql`ALTER TABLE scripts ALTER COLUMN name SET NOT NULL`
  await sql`ALTER TABLE scripts ALTER COLUMN slug SET NOT NULL`
  await sql`ALTER TABLE scripts ALTER COLUMN type SET NOT NULL`
  await sql`ALTER TABLE scripts ALTER COLUMN status SET NOT NULL`

  await sql`ALTER TABLE script_versions ALTER COLUMN version SET NOT NULL`
  await sql`ALTER TABLE script_versions ALTER COLUMN script_type SET NOT NULL`
  await sql`ALTER TABLE script_versions ALTER COLUMN status SET NOT NULL`
}
