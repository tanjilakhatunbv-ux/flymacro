import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "macros"
    SET "price" = 100
    WHERE "tier" = 'premium' AND "price" = 50;
  `)

  await db.execute(sql`
    UPDATE "_macros_v"
    SET "version_price" = 100
    WHERE "version_tier" = 'premium' AND "version_price" = 50;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "macros"
    SET "price" = 50
    WHERE "tier" = 'premium' AND "price" = 100;
  `)

  await db.execute(sql`
    UPDATE "_macros_v"
    SET "version_price" = 50
    WHERE "version_tier" = 'premium' AND "version_price" = 100;
  `)
}
