import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_credit_transactions_type" ADD VALUE IF NOT EXISTS 'redeem_code';
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "redeem_codes" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "code" varchar NOT NULL,
      "credits_granted" varchar NOT NULL,
      "max_redemptions" numeric DEFAULT 1 NOT NULL,
      "redeemed_count" numeric DEFAULT 0 NOT NULL,
      "enabled" boolean DEFAULT true,
      "note" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "redeem_codes_code_unique" UNIQUE ("code")
    );

    CREATE TABLE IF NOT EXISTS "redeem_code_redemptions" (
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "user_id" integer NOT NULL,
      "redeem_code_id" integer NOT NULL,
      "credits_granted" numeric NOT NULL,
      "balance_before" numeric NOT NULL,
      "balance_after" numeric NOT NULL,
      "admin_note" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'redeem_code_redemptions_user_id_users_id_fk'
      ) THEN
        ALTER TABLE "redeem_code_redemptions"
        ADD CONSTRAINT "redeem_code_redemptions_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'redeem_code_redemptions_redeem_code_id_redeem_codes_id_fk'
      ) THEN
        ALTER TABLE "redeem_code_redemptions"
        ADD CONSTRAINT "redeem_code_redemptions_redeem_code_id_redeem_codes_id_fk"
        FOREIGN KEY ("redeem_code_id") REFERENCES "public"."redeem_codes"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "redeem_codes_code_idx" ON "redeem_codes" USING btree ("code");
    CREATE INDEX IF NOT EXISTS "redeem_codes_credits_granted_idx" ON "redeem_codes" USING btree ("credits_granted");
    CREATE INDEX IF NOT EXISTS "redeem_codes_enabled_idx" ON "redeem_codes" USING btree ("enabled");
    CREATE INDEX IF NOT EXISTS "redeem_codes_updated_at_idx" ON "redeem_codes" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "redeem_codes_created_at_idx" ON "redeem_codes" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "redeem_code_redemptions_user_idx" ON "redeem_code_redemptions" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "redeem_code_redemptions_redeem_code_idx" ON "redeem_code_redemptions" USING btree ("redeem_code_id");
    CREATE INDEX IF NOT EXISTS "redeem_code_redemptions_credits_granted_idx" ON "redeem_code_redemptions" USING btree ("credits_granted");
    CREATE INDEX IF NOT EXISTS "redeem_code_redemptions_updated_at_idx" ON "redeem_code_redemptions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "redeem_code_redemptions_created_at_idx" ON "redeem_code_redemptions" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "redeem_codes_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "redeem_code_redemptions_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_redeem_codes_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_redeem_codes_fk"
        FOREIGN KEY ("redeem_codes_id") REFERENCES "public"."redeem_codes"("id") ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_redeem_code_redemptions_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_redeem_code_redemptions_fk"
        FOREIGN KEY ("redeem_code_redemptions_id") REFERENCES "public"."redeem_code_redemptions"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_redeem_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("redeem_codes_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_redeem_code_redemptions_id_idx" ON "payload_locked_documents_rels" USING btree ("redeem_code_redemptions_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redeem_code_redemptions_fk",
    DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redeem_codes_fk",
    DROP COLUMN IF EXISTS "redeem_code_redemptions_id",
    DROP COLUMN IF EXISTS "redeem_codes_id";

    DROP TABLE IF EXISTS "redeem_code_redemptions" CASCADE;
    DROP TABLE IF EXISTS "redeem_codes" CASCADE;
  `)
}
