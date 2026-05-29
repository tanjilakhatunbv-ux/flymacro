import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "credit_packages"
    SET "label" = CONCAT("credits_granted", ' 点券包')
    WHERE
      "credits_granted" IS NOT NULL
      AND (
        "label" LIKE '%???%'
        OR "label" LIKE '%鐐%'
        OR "label" LIKE '%鍖%'
        OR "label" LIKE '%绉%'
        OR "label" LIKE '%�%'
      );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1;`)
}
