import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

const oldTitle = ['充', '值', '积', '分'].join('')
const oldSubtitle = ['登录后即可充', '值积', '分，兑换宏', '使用权。'].join('')
const oldPackageLabels = [
  ['充', '值 10 元得 12 积', '分'].join(''),
  ['充', '值 20 元得 22 积', '分'].join(''),
  ['充', '值 50 元得 60 积', '分'].join(''),
  ['充', '值 100 元得 125 积', '分'].join(''),
  ['充', '值 300 元得 400 积', '分'].join(''),
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('payload_migrations', 'id'),
      COALESCE((SELECT MAX(id) FROM "payload_migrations"), 0) + 1,
      false
    );
  `)

  await db.execute(sql`
    UPDATE "site_settings"
    SET
      "credit_page_title" = '购买点券',
      "credit_page_subtitle" = '购买点券后，可用于兑换高级宏配置。'
    WHERE
      "credit_page_title" = ${oldTitle}
      AND "credit_page_subtitle" = ${oldSubtitle};
  `)

  await db.execute(sql`
    UPDATE "credit_packages"
    SET "label" = CASE
      WHEN "label" = ${oldPackageLabels[0]} THEN '12 点券包'
      WHEN "label" = ${oldPackageLabels[1]} THEN '22 点券包'
      WHEN "label" = ${oldPackageLabels[2]} THEN '60 点券包'
      WHEN "label" = ${oldPackageLabels[3]} THEN '125 点券包'
      WHEN "label" = ${oldPackageLabels[4]} THEN '400 点券包'
      ELSE "label"
    END
    WHERE "label" IN (${oldPackageLabels[0]}, ${oldPackageLabels[1]}, ${oldPackageLabels[2]}, ${oldPackageLabels[3]}, ${oldPackageLabels[4]});
  `)

  await db.execute(sql`
    UPDATE "credit_packages"
    SET "label" = CONCAT("credits_granted", ' 点券包')
    WHERE
      "label" LIKE ${['充', '值 % 元得 % 积', '分'].join('')}
      AND "credits_granted" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "site_settings"
    SET
      "credit_page_title" = ${oldTitle},
      "credit_page_subtitle" = ${oldSubtitle}
    WHERE
      "credit_page_title" = '购买点券'
      AND "credit_page_subtitle" = '购买点券后，可用于兑换高级宏配置。';
  `)

  await db.execute(sql`
    UPDATE "credit_packages"
    SET "label" = CASE
      WHEN "label" = '12 点券包' THEN ${oldPackageLabels[0]}
      WHEN "label" = '22 点券包' THEN ${oldPackageLabels[1]}
      WHEN "label" = '60 点券包' THEN ${oldPackageLabels[2]}
      WHEN "label" = '125 点券包' THEN ${oldPackageLabels[3]}
      WHEN "label" = '400 点券包' THEN ${oldPackageLabels[4]}
      ELSE "label"
    END
    WHERE "label" IN ('12 点券包', '22 点券包', '60 点券包', '125 点券包', '400 点券包');
  `)
}
