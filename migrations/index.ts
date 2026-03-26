import * as migration_20260324_204132_initial_migration from './20260324_204132_initial_migration';
import * as migration_20260325_120004_add_auth_fields from './20260325_120004_add_auth_fields';
import * as migration_20260326_120527_initial_test from './20260326_120527_initial_test';
import * as migration_20260326_120645_mig4 from './20260326_120645_mig4';

export const migrations = [
  {
    up: migration_20260324_204132_initial_migration.up,
    down: migration_20260324_204132_initial_migration.down,
    name: '20260324_204132_initial_migration',
  },
  {
    up: migration_20260325_120004_add_auth_fields.up,
    down: migration_20260325_120004_add_auth_fields.down,
    name: '20260325_120004_add_auth_fields',
  },
  {
    up: migration_20260326_120527_initial_test.up,
    down: migration_20260326_120527_initial_test.down,
    name: '20260326_120527_initial_test',
  },
  {
    up: migration_20260326_120645_mig4.up,
    down: migration_20260326_120645_mig4.down,
    name: '20260326_120645_mig4'
  },
];
