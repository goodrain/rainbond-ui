const assert = require('assert');
const {
  getBackupRepoOptions,
  getBackupRepoPhaseTextId,
  isBackupRepoSelectable,
  shouldAutoSelectCreatedBackupRepo,
  validateBackupRepoSelection
} = require('./backupRepoReadiness');

assert.strictEqual(
  isBackupRepoSelectable({ name: 'repo-ready', phase: 'Ready' }),
  true,
  'Ready backup repos should be selectable'
);

assert.strictEqual(
  isBackupRepoSelectable({ name: 'repo-checking', phase: 'PreChecking' }),
  false,
  'PreChecking backup repos should not be selectable'
);

assert.strictEqual(
  shouldAutoSelectCreatedBackupRepo({ name: 'repo-checking', phase: 'PreChecking' }),
  false,
  'newly created repos should not be auto-selected before the check passes'
);

assert.strictEqual(
  shouldAutoSelectCreatedBackupRepo({ name: 'repo-ready', phase: 'Ready' }),
  true,
  'created repos may be auto-selected only when the backend already reports Ready'
);

assert.strictEqual(
  getBackupRepoPhaseTextId('PreChecking'),
  'kubeblocks.database.backup.repo.phase.checking',
  'PreChecking should be shown as checking instead of unavailable'
);

assert.strictEqual(
  getBackupRepoPhaseTextId('Failed'),
  'kubeblocks.database.backup.repo.phase.failed',
  'Failed backup repos should have a clear failed label'
);

assert.deepStrictEqual(
  getBackupRepoOptions([
    { name: 'repo-ready', phase: 'Ready' },
    { name: 'repo-checking', phase: 'PreChecking' },
    { name: 'repo-missing', phase: 'Missing' }
  ]).map(item => item.name),
  ['repo-ready', 'repo-checking', 'repo-missing'],
  'the selector should keep non-ready repos visible so users can see their status'
);

assert.strictEqual(
  validateBackupRepoSelection('repo-missing', [
    { name: 'repo-missing', phase: 'Missing' }
  ]),
  false,
  'non-ready backup repos should fail form validation when selected'
);

console.log('backup repo readiness tests passed');
