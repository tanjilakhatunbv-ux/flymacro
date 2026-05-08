import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "credit_orders" ADD CONSTRAINT "credit_orders_dodo_checkout_id_unique" UNIQUE ("dodo_checkout_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "credit_orders" DROP CONSTRAINT IF EXISTS "credit_orders_dodo_checkout_id_unique";
  `)
}
