import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create audit_logs enum if not exists
    CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('create_user', 'update_user', 'delete_user', 'create_ticket', 'update_ticket', 'delete_ticket', 'create_order', 'update_order', 'delete_order', 'other');

    -- Create audit_logs table
    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "action" "enum_audit_logs_action" NOT NULL,
      "collection" varchar NOT NULL,
      "doc_id" varchar,
      "before" jsonb,
      "after" jsonb,
      "operator_id" integer NOT NULL,
      "reason" varchar,
      "ip" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Audit logs indexes
    CREATE INDEX IF NOT EXISTS "audit_logs_operator_idx" ON "audit_logs" ("operator_id");
    CREATE INDEX IF NOT EXISTS "audit_logs_updated_at_idx" ON "audit_logs" ("updated_at");
    CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at");

    -- Add missing columns to payload_locked_documents_rels
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "plugin_files_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "plugin_releases_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "audit_logs_id" integer;

    -- Add foreign keys for new columns
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_plugin_files_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_plugin_files_fk"
        FOREIGN KEY ("plugin_files_id") REFERENCES "plugin_files"("id") ON DELETE cascade;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_plugin_releases_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_plugin_releases_fk"
        FOREIGN KEY ("plugin_releases_id") REFERENCES "plugin_releases"("id") ON DELETE cascade;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_audit_logs_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk"
        FOREIGN KEY ("audit_logs_id") REFERENCES "audit_logs"("id") ON DELETE cascade;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_audit_logs_fk",
    DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_plugin_releases_fk",
    DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_plugin_files_fk",
    DROP COLUMN IF EXISTS "audit_logs_id",
    DROP COLUMN IF EXISTS "plugin_releases_id",
    DROP COLUMN IF EXISTS "plugin_files_id";

    DROP TABLE IF EXISTS "audit_logs";
    DROP TYPE IF EXISTS "public"."enum_audit_logs_action";
  `)
}
