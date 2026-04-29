const assert = require('assert');
const {
  buildNextSnapshotVersion,
  getLatestSnapshotVersionSeed
} = require('./snapshotVersionHelpers');

assert.strictEqual(
  getLatestSnapshotVersionSeed({
    current_version: '2.0.0',
    latest_snapshot_version: '3.0.0'
  }),
  '3.0.0',
  'should prefer the latest created snapshot version after a rollback changes the current baseline'
);

assert.strictEqual(
  getLatestSnapshotVersionSeed({
    current_version: '2.0.0',
    latest_snapshot_version: ''
  }),
  '2.0.0',
  'should fall back to the current baseline when there is no latest snapshot version'
);

assert.strictEqual(
  getLatestSnapshotVersionSeed({}),
  '',
  'should return an empty seed when no version data is available'
);

assert.strictEqual(
  buildNextSnapshotVersion('3.0'),
  '3.0.1',
  'should normalize two-part snapshot versions back to three-part patch versions'
);

assert.strictEqual(
  buildNextSnapshotVersion('3.0.0'),
  '3.0.1',
  'should keep incrementing three-part snapshot versions by patch'
);
