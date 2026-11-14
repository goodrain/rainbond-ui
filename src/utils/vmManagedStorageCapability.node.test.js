const assert = require('node:assert/strict');
const test = require('node:test');
const storage = require('./vmCreationStorage');

const generic = { status: 'supported', supported: true, reason_code: 'native_ready' };

test('managed eligibility is independent of generic CSI facts and storage names', () => {
  for (const name of ['arbitrary-first', 'looks-like-supported']) {
    const choice = storage.normalizeVmCreationStorageOptions([{ volume_type: name, name_show: name,
      snapshot_capability: generic, managed_snapshot_capability: { status: 'unsupported', supported: false,
        reason_code: 'managed_driver_unsupported' } }])[0];
    assert.equal(choice.snapshotCapability.state, 'supported');
    assert.equal(choice.managedSnapshotCapability.state, 'unsupported');
    assert.equal(storage.normalizeStorageChoice(choice).managedSnapshotCapability.state, 'unsupported');
  }
});

test('missing or malformed managed evidence never falls back to generic supported', () => {
  for (const value of [undefined, null, [], {}, { status: 'supported', supported: false }, { status: 'supported', supported: 1 }]) {
    const option = { volume_type: 'choice', name_show: 'Choice', snapshot_capability: generic };
    if (value !== undefined) option.managed_snapshot_capability = value;
    const choice = storage.normalizeVmCreationStorageOptions([option])[0];
    assert.equal(choice.snapshotCapability.state, 'supported');
    assert.equal(choice.managedSnapshotCapability?.state || 'unknown', 'unknown');
  }
});

test('ordinary VM storage remains selectable when snapshots are unsupported or unknown', async () => {
  const value = await storage.fetchVmCreationStorage({ payload: { team_name: 'team-a', region_name: 'region-a' } }, {
    getCapabilities: async () => ({ status_code: 200, business_code: 200, bean: { storage_options: [
      { volume_type: 'first', name_show: 'First', snapshot_capability: generic,
        managed_snapshot_capability: { status: 'unsupported', supported: false } },
      { volume_type: 'second', name_show: 'Second', snapshot_capability: generic }
    ] } }), getLegacyVolumeOpts: async () => { throw new Error('No fallback expected'); }
  });
  assert.equal(value.status, 'ready');
  assert.deepEqual(value.options.map(x => x.value), ['first', 'second']);
  assert.equal(value.options[0].managedSnapshotCapability.state, 'unsupported');
});
