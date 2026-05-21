import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Rename credit_packages column
  await db.execute(sql`
    ALTER TABLE "credit_packages"
    RENAME COLUMN "dodo_product_id" TO "creem_product_id";
  `)

  // Rename credit_orders column and update unique constraint
  await db.execute(sql`
    ALTER TABLE "credit_orders"
    DROP CONSTRAINT IF EXISTS "credit_orders_dodo_checkout_id_unique";
  `)
  await db.execute(sql`
    ALTER TABLE "credit_orders"
    RENAME COLUMN "dodo_checkout_id" TO "creem_checkout_id";
  `)
  await db.execute(sql`
    ALTER TABLE "credit_orders" ADD CONSTRAINT "credit_orders_creem_checkout_id_unique" UNIQUE ("creem_checkout_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "credit_packages"
    RENAME COLUMN "creem_product_id" TO "dodo_product_id";
  `)

  await db.execute(sql`
    ALTER TABLE "credit_orders"
    DROP CONSTRAINT IF EXISTS "credit_orders_creem_checkout_id_unique";
  `)
  await db.execute(sql`
    ALTER TABLE "credit_orders"
    RENAME COLUMN "creem_checkout_id" TO "dodo_checkout_id";
  `)
  await db.execute(sql`
    ALTER TABLE "credit_orders" ADD CONSTRAINT "credit_orders_dodo_checkout_id_unique" UNIQUE ("dodo_checkout_id");
  `)
}
