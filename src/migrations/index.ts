import * as migration_20260504_084424 from './20260504_084424';
import * as migration_20260505_simplify_macros from './20260505_simplify_macros';
import * as migration_20260507_add_featured_fields from './20260507_add_featured_fields';
import * as migration_20260507_add_macro_seo_and_credit_fields from './20260507_add_macro_seo_and_credit_fields';
import * as migration_20260507_update_premium_macro_price from './20260507_update_premium_macro_price';
import * as migration_20260507_add_plugin_collections from './20260507_add_plugin_collections';
import * as migration_20260507_add_user_status_and_joins from './20260507_add_user_status_and_joins';

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
];
