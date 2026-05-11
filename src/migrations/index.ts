import * as migration_20260504_084424 from './20260504_084424';
import * as migration_20260505_simplify_macros from './20260505_simplify_macros';
import * as migration_20260507_add_featured_fields from './20260507_add_featured_fields';
import * as migration_20260507_add_macro_seo_and_credit_fields from './20260507_add_macro_seo_and_credit_fields';
import * as migration_20260507_update_premium_macro_price from './20260507_update_premium_macro_price';
import * as migration_20260507_add_plugin_collections from './20260507_add_plugin_collections';
import * as migration_20260507_add_user_status_and_joins from './20260507_add_user_status_and_joins';
import * as migration_20260508_sync_audit_logs_and_rels from './20260508_sync_audit_logs_and_rels';
import * as migration_20260508_add_credit_transactions_label from './20260508_add_credit_transactions_label';
import * as migration_20260508_add_site_settings from './20260508_add_site_settings';
import * as migration_20260508_add_credit_orders_checkout_unique from './20260508_add_credit_orders_checkout_unique';
import * as migration_20260511_add_news_collection from './20260511_add_news_collection';
import * as migration_20260511_consolidate_roles from './20260511_consolidate_roles';
import * as migration_20260511_add_audit_metadata from './20260511_add_audit_metadata';

export const migrations = [
  {
    up: migration_20260504_084424.up,
    down: migration_20260504_084424.down,
    name: '20260504_084424'
  },
  {
    up: migration_20260505_simplify_macros.up,
    down: migration_20260505_simplify_macros.down,
    name: '20260505_simplify_macros'
  },
  {
    up: migration_20260507_add_featured_fields.up,
    down: migration_20260507_add_featured_fields.down,
    name: '20260507_add_featured_fields'
  },
  {
    up: migration_20260507_add_macro_seo_and_credit_fields.up,
    down: migration_20260507_add_macro_seo_and_credit_fields.down,
    name: '20260507_add_macro_seo_and_credit_fields'
  },
  {
    up: migration_20260507_update_premium_macro_price.up,
    down: migration_20260507_update_premium_macro_price.down,
    name: '20260507_update_premium_macro_price'
  },
  {
    up: migration_20260507_add_plugin_collections.up,
    down: migration_20260507_add_plugin_collections.down,
    name: '20260507_add_plugin_collections'
  },
  {
    up: migration_20260507_add_user_status_and_joins.up,
    down: migration_20260507_add_user_status_and_joins.down,
    name: '20260507_add_user_status_and_joins'
  },
  {
    up: migration_20260508_sync_audit_logs_and_rels.up,
    down: migration_20260508_sync_audit_logs_and_rels.down,
    name: '20260508_sync_audit_logs_and_rels'
  },
  {
    up: migration_20260508_add_credit_transactions_label.up,
    down: migration_20260508_add_credit_transactions_label.down,
    name: '20260508_add_credit_transactions_label'
  },
  {
    up: migration_20260508_add_site_settings.up,
    down: migration_20260508_add_site_settings.down,
    name: '20260508_add_site_settings'
  },
  {
    up: migration_20260508_add_credit_orders_checkout_unique.up,
    down: migration_20260508_add_credit_orders_checkout_unique.down,
    name: '20260508_add_credit_orders_checkout_unique'
  },
  {
    up: migration_20260511_add_news_collection.up,
    down: migration_20260511_add_news_collection.down,
    name: '20260511_add_news_collection'
  },
  {
    up: migration_20260511_consolidate_roles.up,
    down: migration_20260511_consolidate_roles.down,
    name: '20260511_consolidate_roles'
  },
  {
    up: migration_20260511_add_audit_metadata.up,
    down: migration_20260511_add_audit_metadata.down,
    name: '20260511_add_audit_metadata'
  },
];
