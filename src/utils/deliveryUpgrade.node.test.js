const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deliveryUpgradePath, prioritizeDeliveryUpgrade } = require('./deliveryUpgrade');
const info = { available: true, app_model_id: 'market-key', upgrade_group_id: '73', current_version: '1.0', latest_version: '2.0',
  target: { team_name: 'production-team', region_name: 'cluster-b', app_id: '42' } };

test('upgrade entry addresses the actual target application and its exact installed source', () => {
  assert.equal(deliveryUpgradePath(info), '/team/production-team/region/cluster-b/apps/42/upgrade?app_model_id=market-key&upgrade_group_id=73');
  assert.equal(deliveryUpgradePath({ ...info, available: false }), '');
  assert.equal(deliveryUpgradePath({ ...info, target: { ...info.target, app_id: '' } }), '');
  assert.equal(deliveryUpgradePath({ ...info, upgrade_group_id: '' }), '');
});

test('upgrade list prioritizes the exact installed group without hiding other templates or changing the input', () => {
  const items = [{ group_key: 'market-key', upgrade_group_id: 9 }, { group_key: 'other-key', upgrade_group_id: 73 },
    { group_key: 'market-key', upgrade_group_id: 73 }];
  const sorted = prioritizeDeliveryUpgrade(items, { search: '?app_model_id=market-key&upgrade_group_id=73' });
  assert.equal(sorted[0], items[2]);
  assert.equal(sorted.length, 3);
  assert.equal(items[0].upgrade_group_id, 9);
  assert.equal(prioritizeDeliveryUpgrade(items, {}), items);
});
