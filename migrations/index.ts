import * as migration_20260324_204132_initial_migration from './20260324_204132_initial_migration';
import * as migration_20260325_120004_add_auth_fields from './20260325_120004_add_auth_fields';
import * as migration_20260326_120527_initial_test from './20260326_120527_initial_test';
import * as migration_20260326_120645_mig4 from './20260326_120645_mig4';
import * as migration_20260328_185141_mig5 from './20260328_185141_mig5';
import * as migration_20260328_232154_mig6 from './20260328_232154_mig6';
import * as migration_20260401_124057_mig6_learning from './20260401_124057_mig6_learning';
import * as migration_20260402_102906_mig8 from './20260402_102906_mig8';
import * as migration_20260409_171419_add_phase_scoring from './20260409_171419_add_phase_scoring';
import * as migration_20260409_200859 from './20260409_200859';
import * as migration_20260411_122606 from './20260411_122606';

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
    name: '20260328_232154_mig6',
  },
  {
    up: migration_20260401_124057_mig6_learning.up,
    down: migration_20260401_124057_mig6_learning.down,
    name: '20260401_124057_mig6_learning',
  },
  {
    up: migration_20260402_102906_mig8.up,
    down: migration_20260402_102906_mig8.down,
    name: '20260402_102906_mig8',
  },
  {
    up: migration_20260409_171419_add_phase_scoring.up,
    down: migration_20260409_171419_add_phase_scoring.down,
    name: '20260409_171419_add_phase_scoring',
  },
  {
    up: migration_20260409_200859.up,
    down: migration_20260409_200859.down,
    name: '20260409_200859',
  },
  {
    up: migration_20260411_122606.up,
    down: migration_20260411_122606.down,
    name: '20260411_122606',
  },
];
