const test = require('node:test');
const assert = require('node:assert/strict');

const { resolvePluginRegionName } = require('./pluginRegion');

test('plugin region resolver prefers explicit query region over legacy route region', () => {
  assert.equal(
    resolvePluginRegionName({
      currRegionName: '',
      queryRegionName: '1777519204',
      routeRegionId: 'rainbond'
    }),
    '1777519204'
  );
});

test('plugin region resolver still prefers team route region when present', () => {
  assert.equal(
    resolvePluginRegionName({
      currRegionName: 'team-region',
      queryRegionName: '1777519204',
      routeRegionId: 'legacy-region'
    }),
    'team-region'
  );
});
