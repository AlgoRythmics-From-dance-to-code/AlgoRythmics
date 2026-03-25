import * as migration_20260324_204132_initial_migration from './20260324_204132_initial_migration';
import * as migration_20260325_120004_add_auth_fields from './20260325_120004_add_auth_fields';

export const migrations = [
  {
    up: migration_20260324_204132_initial_migration.up,
    down: migration_20260324_204132_initial_migration.down,
    name: '20260324_204132_initial_migration',
  },
  {
    up: migration_20260325_120004_add_auth_fields.up,
    down: migration_20260325_120004_add_auth_fields.down,
    name: '20260325_120004_add_auth_fields'
  },
];
