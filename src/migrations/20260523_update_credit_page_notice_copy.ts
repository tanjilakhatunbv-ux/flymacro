import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

const oldSubtitle = '购买点券后，可用于兑换高级宏配置。'
const newSubtitle = '购买点券后，可用于兑换宏脚本。'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "site_settings"
    SET "credit_page_subtitle" = ${newSubtitle}
    WHERE "credit_page_subtitle" = ${oldSubtitle};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "site_settings"
    SET "credit_page_subtitle" = ${oldSubtitle}
    WHERE "credit_page_subtitle" = ${newSubtitle};
  `)
}
