import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

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
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE news
      ALTER COLUMN title DROP NOT NULL,
      ALTER COLUMN slug  DROP NOT NULL;

    ALTER TABLE scripts
      ALTER COLUMN name   DROP NOT NULL,
      ALTER COLUMN slug   DROP NOT NULL,
      ALTER COLUMN type   DROP NOT NULL,
      ALTER COLUMN status DROP NOT NULL;

    ALTER TABLE script_versions
      ALTER COLUMN version      DROP NOT NULL,
      ALTER COLUMN script_type  DROP NOT NULL,
      ALTER COLUMN status       DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE news
      ALTER COLUMN title SET NOT NULL,
      ALTER COLUMN slug  SET NOT NULL;

    ALTER TABLE scripts
      ALTER COLUMN name   SET NOT NULL,
      ALTER COLUMN slug   SET NOT NULL,
      ALTER COLUMN type   SET NOT NULL,
      ALTER COLUMN status SET NOT NULL;

    ALTER TABLE script_versions
      ALTER COLUMN version      SET NOT NULL,
      ALTER COLUMN script_type  SET NOT NULL,
      ALTER COLUMN status       SET NOT NULL;
  `)
}
