import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "site_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "credit_page_title" varchar DEFAULT '购买点券',
      "credit_page_subtitle" varchar DEFAULT '购买点券后，可用于兑换宏脚本。',
      "credit_page_promo_enabled" boolean DEFAULT false,
      "credit_page_promo_banner" varchar,
      "credit_page_notice_enabled" boolean DEFAULT true,
      "credit_page_notice" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "site_settings";`)
}
