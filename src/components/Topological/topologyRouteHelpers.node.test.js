const assert = require('assert');
const test = require('node:test');
const { buildTopologyWebConsolePath } = require('./topologyRouteHelpers');

test('topology terminal path requires complete route parameters', () => {
  assert.strictEqual(
    buildTopologyWebConsolePath('team', 'region', 'component'),
    '/team/team/region/region/components/component/webconsole'
  );
  assert.strictEqual(buildTopologyWebConsolePath('', 'region', 'component'), null);
  assert.strictEqual(buildTopologyWebConsolePath('team', '', 'component'), null);
  assert.strictEqual(buildTopologyWebConsolePath('team', 'region', ''), null);
});
