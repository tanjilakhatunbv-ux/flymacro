import * as migration_20260504_084424 from './20260504_084424';
import * as migration_20260505_simplify_macros from './20260505_simplify_macros';
import * as migration_20260507_add_featured_fields from './20260507_add_featured_fields';
import * as migration_20260507_add_macro_seo_and_credit_fields from './20260507_add_macro_seo_and_credit_fields';

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
];
