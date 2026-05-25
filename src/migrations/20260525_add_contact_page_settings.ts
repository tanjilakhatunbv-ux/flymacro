import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "contact_page_enabled" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "contact_page_email_enabled" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "contact_page_email_value" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_email_note" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_telegram_enabled" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "contact_page_telegram_value" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_telegram_url" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_telegram_note" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_discord_enabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "contact_page_discord_value" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_discord_url" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_discord_note" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_qq_enabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "contact_page_qq_value" varchar,
      ADD COLUMN IF NOT EXISTS "contact_page_qq_note" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "contact_page_enabled",
      DROP COLUMN IF EXISTS "contact_page_email_enabled",
      DROP COLUMN IF EXISTS "contact_page_email_value",
      DROP COLUMN IF EXISTS "contact_page_email_note",
      DROP COLUMN IF EXISTS "contact_page_telegram_enabled",
      DROP COLUMN IF EXISTS "contact_page_telegram_value",
      DROP COLUMN IF EXISTS "contact_page_telegram_url",
      DROP COLUMN IF EXISTS "contact_page_telegram_note",
      DROP COLUMN IF EXISTS "contact_page_discord_enabled",
      DROP COLUMN IF EXISTS "contact_page_discord_value",
      DROP COLUMN IF EXISTS "contact_page_discord_url",
      DROP COLUMN IF EXISTS "contact_page_discord_note",
      DROP COLUMN IF EXISTS "contact_page_qq_enabled",
      DROP COLUMN IF EXISTS "contact_page_qq_value",
      DROP COLUMN IF EXISTS "contact_page_qq_note";
  `)
}
