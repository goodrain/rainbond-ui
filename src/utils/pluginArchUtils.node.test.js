const assert = require('assert');

function test(name, fn) {
  fn();
  console.log(`ok - ${name}`);
}

const {
  getPluginBaseId,
  isPluginBaseId,
  shouldFetchUserBalanceForPlugins
} = require('./pluginArchUtils');

test('getPluginBaseId returns value unchanged when no arch suffix', () => {
  assert.equal(getPluginBaseId('rainbond-agent'), 'rainbond-agent');
  assert.equal(getPluginBaseId('rainbond-gpu'), 'rainbond-gpu');
});

test('getPluginBaseId strips uppercase arch suffixes', () => {
  assert.equal(getPluginBaseId('rainbond-agent-ARM64'), 'rainbond-agent');
  assert.equal(getPluginBaseId('rainbond-agent-AMD64'), 'rainbond-agent');
});

test('getPluginBaseId is case insensitive for the suffix only', () => {
  assert.equal(getPluginBaseId('rainbond-agent-arm64'), 'rainbond-agent');
  assert.equal(getPluginBaseId('Rainbond-Agent-Amd64'), 'Rainbond-Agent');
});

test('getPluginBaseId handles empty / nullish inputs', () => {
  assert.equal(getPluginBaseId(''), '');
  assert.equal(getPluginBaseId(null), '');
  assert.equal(getPluginBaseId(undefined), '');
  assert.equal(getPluginBaseId(0), '0');
});

test('getPluginBaseId leaves unrelated suffixes intact', () => {
  assert.equal(getPluginBaseId('rainbond-agent-foo'), 'rainbond-agent-foo');
  assert.equal(getPluginBaseId('ARM64'), 'ARM64');
});

test('isPluginBaseId matches plugin_id by base name', () => {
  assert.equal(
    isPluginBaseId({ plugin_id: 'rainbond-agent-ARM64', name: 'rainbond-agent-ARM64' }, 'rainbond-agent'),
    true
  );
  assert.equal(
    isPluginBaseId({ plugin_id: 'rainbond-agent', name: 'rainbond-agent' }, 'rainbond-agent'),
    true
  );
});

test('isPluginBaseId matches name when plugin_id is missing', () => {
  assert.equal(
    isPluginBaseId({ name: 'rainbond-agent-AMD64' }, 'rainbond-agent'),
    true
  );
});

test('isPluginBaseId returns false for unrelated plugin', () => {
  assert.equal(
    isPluginBaseId({ plugin_id: 'rainbond-gpu', name: 'rainbond-gpu' }, 'rainbond-agent'),
    false
  );
});

test('isPluginBaseId rejects nullish inputs', () => {
  assert.equal(isPluginBaseId(null, 'rainbond-agent'), false);
  assert.equal(isPluginBaseId({}, ''), false);
  assert.equal(isPluginBaseId(undefined, 'rainbond-agent'), false);
});

test('shouldFetchUserBalanceForPlugins only enables the bill plugin balance API', () => {
  assert.equal(
    shouldFetchUserBalanceForPlugins([
      { name: 'rainbond-agent', plugin_id: 'rainbond-agent', installed: true }
    ]),
    false
  );

  assert.equal(
    shouldFetchUserBalanceForPlugins([
      { name: 'rainbond-agent', plugin_id: 'rainbond-agent', installed: true },
      { name: 'rainbond-bill', plugin_id: 'rainbond-bill', installed: true }
    ]),
    true
  );
});

test('shouldFetchUserBalanceForPlugins honors bill plugin installation status and arch suffixes', () => {
  assert.equal(
    shouldFetchUserBalanceForPlugins([
      { name: 'rainbond-bill', plugin_id: 'rainbond-bill', installed: false }
    ]),
    false
  );

  assert.equal(
    shouldFetchUserBalanceForPlugins([
      { name: 'rainbond-bill-ARM64', plugin_id: 'rainbond-bill-ARM64', installed: true }
    ]),
    true
  );
});
