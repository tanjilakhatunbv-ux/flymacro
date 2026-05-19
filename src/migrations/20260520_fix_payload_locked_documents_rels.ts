import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix: The payload_locked_documents_rels table was missing foreign key columns
 * for the script management collections (scripts, script_files, script_versions).
 * This caused document locking queries to fail during create/update operations
 * on these collections, resulting in documents not persisting to the database
 * despite appearing to succeed (transaction rollback due to aborted PG query).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels
    ADD COLUMN IF NOT EXISTS scripts_id integer,
    ADD COLUMN IF NOT EXISTS script_files_id integer,
    ADD COLUMN IF NOT EXISTS script_versions_id integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE payload_locked_documents_rels
        ADD CONSTRAINT payload_locked_documents_rels_scripts_fk
        FOREIGN KEY (scripts_id) REFERENCES scripts(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE payload_locked_documents_rels
        ADD CONSTRAINT payload_locked_documents_rels_script_files_fk
        FOREIGN KEY (script_files_id) REFERENCES script_files(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE payload_locked_documents_rels
        ADD CONSTRAINT payload_locked_documents_rels_script_versions_fk
        FOREIGN KEY (script_versions_id) REFERENCES script_versions(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels
    DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_script_versions_fk,
    DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_script_files_fk,
    DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_scripts_fk;
  `)

  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels
    DROP COLUMN IF EXISTS script_versions_id,
    DROP COLUMN IF EXISTS script_files_id,
    DROP COLUMN IF EXISTS scripts_id;
  `)
}
