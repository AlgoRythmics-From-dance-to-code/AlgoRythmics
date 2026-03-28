import * as migration_20260324_204132_initial_migration from './20260324_204132_initial_migration';
import * as migration_20260325_120004_add_auth_fields from './20260325_120004_add_auth_fields';
import * as migration_20260326_120527_initial_test from './20260326_120527_initial_test';
import * as migration_20260326_120645_mig4 from './20260326_120645_mig4';
import * as migration_20260328_185141_mig5 from './20260328_185141_mig5';
import * as migration_20260328_232154_mig6 from './20260328_232154_mig6';

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
    name: '20260326_120645_mig4',
  },
  {
    up: migration_20260328_185141_mig5.up,
    down: migration_20260328_185141_mig5.down,
    name: '20260328_185141_mig5',
  },
  {
    up: migration_20260328_232154_mig6.up,
    down: migration_20260328_232154_mig6.down,
    name: '20260328_232154_mig6'
  },
];
