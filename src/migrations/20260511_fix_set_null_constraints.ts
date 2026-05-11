import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

async function changeFK(
  db: MigrateUpArgs['db'],
  table: string,
  constraint: string,
  column: string,
  target: string,
  rule: string,
) {
  await db.execute(sql.raw(
    `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}";`
  ))
  await db.execute(sql.raw(
    `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${column}") REFERENCES "${target}"("id") ON DELETE ${rule};`
  ))
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Fix SET NULL + NOT NULL conflicts that cause delete failures.
  // If the FK column is NOT NULL, SET NULL can never succeed → change to CASCADE.

  await changeFK(db, 'specs', 'specs_class_id_classes_id_fk', 'class_id', 'classes', 'CASCADE')
  await changeFK(db, 'ticket_messages', 'ticket_messages_ticket_id_tickets_id_fk', 'ticket_id', 'tickets', 'CASCADE')
  await changeFK(db, 'macro_exchanges', 'macro_exchanges_macro_id_macros_id_fk', 'macro_id', 'macros', 'CASCADE')
  await changeFK(db, 'credit_orders', 'credit_orders_user_id_users_id_fk', 'user_id', 'users', 'CASCADE')
  await changeFK(db, 'credit_transactions', 'credit_transactions_user_id_users_id_fk', 'user_id', 'users', 'CASCADE')
  await changeFK(db, 'macro_exchanges', 'macro_exchanges_user_id_users_id_fk', 'user_id', 'users', 'CASCADE')
  await changeFK(db, 'notifications', 'notifications_recipient_id_users_id_fk', 'recipient_id', 'users', 'CASCADE')
  await changeFK(db, 'ticket_messages', 'ticket_messages_sender_id_users_id_fk', 'sender_id', 'users', 'CASCADE')
  await changeFK(db, 'tickets', 'tickets_user_id_users_id_fk', 'user_id', 'users', 'CASCADE')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await changeFK(db, 'specs', 'specs_class_id_classes_id_fk', 'class_id', 'classes', 'SET NULL')
  await changeFK(db, 'ticket_messages', 'ticket_messages_ticket_id_tickets_id_fk', 'ticket_id', 'tickets', 'SET NULL')
  await changeFK(db, 'macro_exchanges', 'macro_exchanges_macro_id_macros_id_fk', 'macro_id', 'macros', 'SET NULL')
  await changeFK(db, 'credit_orders', 'credit_orders_user_id_users_id_fk', 'user_id', 'users', 'SET NULL')
  await changeFK(db, 'credit_transactions', 'credit_transactions_user_id_users_id_fk', 'user_id', 'users', 'SET NULL')
  await changeFK(db, 'macro_exchanges', 'macro_exchanges_user_id_users_id_fk', 'user_id', 'users', 'SET NULL')
  await changeFK(db, 'notifications', 'notifications_recipient_id_users_id_fk', 'recipient_id', 'users', 'SET NULL')
  await changeFK(db, 'ticket_messages', 'ticket_messages_sender_id_users_id_fk', 'sender_id', 'users', 'SET NULL')
  await changeFK(db, 'tickets', 'tickets_user_id_users_id_fk', 'user_id', 'users', 'SET NULL')
}
