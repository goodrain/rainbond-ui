const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { normalizeTemplateConfig, validateTemplateConfig, validateTemplateInfo, buildTemplatePayload,
  deliveryScope, appendTemplateRecord } = require('./templateDelivery');
const scope = { enterprise_id: 'enterprise', teamName: 'team', regionName: 'region', appID: '1' };
const component = { service_id: 'web', service_alias: 'web', name: 'Web' };
const config = () => normalizeTemplateConfig(component, [{ attr_name: 'LOG_LEVEL', attr_value: 'info' }], { current_memory: 1536, current_cpu: 1500 });
const values = { template_name: ' Portal ', version: '1.0.0', description: 'Release', service_ids: ['web'] };
const payload = () => buildTemplatePayload(values, { web: config() }, { destination: 'local' });

test('template config is a copy and preserves zero resource limits', () => {
  const envs = [{ attr_name: 'MODE', attr_value: 'production' }];
  const row = normalizeTemplateConfig(component, envs, { current_cpu: 0, current_memory: 0 });
  row.service_env_map_list[0].attr_value = 'testing';
  assert.equal(envs[0].attr_value, 'production');
  assert.equal(row.extend_method_map.container_cpu, 0);
  assert.equal(row.extend_method_map.init_memory, 0);
  assert.deepEqual(validateTemplateConfig(row), {});
});

test('portable templates retain sensitive variable names without environment-specific values', () => {
  const row = normalizeTemplateConfig(component, [{ attr_name: 'DEPLOY_SECRET', attr_value: '$DEPLOY_VALUE' }], {});
  assert.equal(row.service_env_map_list[0].attr_value, '');
  row.service_env_map_list[0].attr_value = '$INSTALL_VALUE';
  const result = buildTemplatePayload(values, { web: row }, { destination: 'local' });
  assert.deepEqual(result.component_overrides[0].service_env_map_list[0], {
    attr_name: 'DEPLOY_SECRET', attr_value: '', required_on_install: true, is_sensitive: true
  });
  for (const name of ['API_KEY', 'ACCESS_KEY', 'AUTHORIZATION']) {
    const protectedConfig = normalizeTemplateConfig(component, [{ attr_name: name, attr_value: '$INSTALL_VALUE' }], {});
    assert.equal(protectedConfig.service_env_map_list[0].attr_value, '');
  }
});

test('scaling validates ranges, integers and component-specific capabilities', () => {
  const row = config();
  row.extend_method_map.min_node = 3; row.extend_method_map.max_node = 2;
  assert.equal(validateTemplateConfig(row).max_node, 'rangeInvalid');
  row.extend_method = 'daemonset';
  assert.deepEqual(validateTemplateConfig(row), {});
  assert.equal(buildTemplatePayload(values, { web: row }, { destination: 'local' }).component_overrides[0].extend_method_map.min_node, undefined);
  row.extend_method = 'vm'; row.extend_method_map.container_cpu = -1;
  assert.deepEqual(validateTemplateConfig(row), {});
  assert.equal(buildTemplatePayload(values, { web: row }, { destination: 'local' }).component_overrides[0].extend_method_map, undefined);
});

test('environment names must be valid and unique', () => {
  const row = config();
  row.service_env_map_list.push({ attr_name: 'LOG_LEVEL', attr_value: 'debug' });
  assert.equal(validateTemplateConfig(row).environment, 'environmentInvalid');
  row.service_env_map_list[1].attr_name = '9INVALID';
  assert.equal(validateTemplateConfig(row).environment, 'environmentInvalid');
});

test('all selected components must have validated configuration', () => {
  assert.throws(() => buildTemplatePayload(values, {}, { destination: 'local' }), /configIncomplete/);
  assert.equal(validateTemplateInfo({ ...values, service_ids: [] }).service_ids, 'componentsRequired');
  assert.equal(validateTemplateInfo({ ...values, version: 'main' }).version, 'versionInvalid');
});

test('delivery payload is independent of snapshots and includes only selected component configuration', () => {
  const row = buildTemplatePayload({ ...values, snapshot_app_id: 'ignored', snapshot_version: 'ignored' },
    { web: config(), unused: config() }, { destination: 'local' });
  assert.equal(row.template_name, 'Portal');
  assert.equal(row.component_overrides.length, 1);
  assert.equal(row.component_overrides[0].extend_method_map.container_cpu, 1500);
  assert.equal(row.component_overrides[0].extend_method_map.init_memory, 1536);
  assert.equal(Object.keys(row).some(key => key.startsWith('snapshot')), false);
});

test('destination and platform plugin metadata are validated and normalized', () => {
  assert.throws(() => buildTemplatePayload(values, { web: config() }, { destination: 'market' }), /destinationRequired/);
  assert.equal(validateTemplateInfo(values, true, {}).plugin_id, 'pluginRequired');
  const result = buildTemplatePayload(values, { web: config() }, { destination: 'market', market_id: 'store', pluginEnabled: true,
    plugin: { plugin_id: 'plugin', plugin_name: 'Plugin', plugin_type: 'JSInject', entry_path: '/static/main.js', inject_position: ['NoInject'], route_path: 'settings' } });
  assert.deepEqual(result.plugin.inject_position, []);
  assert.equal(result.market_id, 'store');
  assert.equal(result.plugin.route_path, '/plugins/settings');
});

test('records preserve immutable versions and reject duplicate versions within an application', () => {
  const source = payload();
  const first = appendTemplateRecord([], scope, source, [component], { user_id: 1 }, '2026-11-05', 'first');
  source.component_overrides[0].extend_method_map.container_cpu = 0;
  assert.equal(first.row.component_overrides[0].extend_method_map.container_cpu, 1500);
  assert.throws(() => appendTemplateRecord(first.records, scope, payload(), [component], {}, '', 'second'), /versionExists/);
  assert.doesNotThrow(() => appendTemplateRecord(first.records, { ...scope, appID: '2' }, payload(), [component], {}, '', 'second'));
  assert.notEqual(deliveryScope(scope), deliveryScope({ ...scope, enterprise_id: 'other' }));
});

test('offline delivery does not fabricate an available package or download URL', () => {
  const row = appendTemplateRecord([], scope, { ...payload(), destination: 'offline' }, [component], {}, '', 'offline').row;
  assert.equal(row.status, 'packaging');
  assert.equal(row.download_url, undefined);
});

test('component configuration uses the read-only source definition and preserves zero quotas', async () => {
  const context = { require, apiconfig: { baseUrl: '' } };
  const code = fs.readFileSync(`${__dirname}/../services/templateDelivery.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  vm.runInNewContext(code, context);
  const result = await context.loadDeliveryConfig({ component: { ...component,
    extend_method_map: { min_node: 1, max_node: 3, step_node: 1, init_memory: 0, container_cpu: 0 },
    configuration: { service_env_map_list: [{ attr_name: 'MODE', attr_value: 'production' }] } } });
  assert.equal(result.bean.extend_method_map.container_cpu, 0);
  assert.equal(result.bean.extend_method_map.init_memory, 0);
  assert.equal(result.bean.service_env_map_list[0].attr_value, 'production');
});

function publishBridge() {
  const source = fs.readFileSync(`${__dirname}/../pages/AppVersion/index.js`, 'utf8');
  const method = source.match(/  createPublishRecord = async [\s\S]*?\n  };/)[0];
  const calls = [];
  const Target = vm.runInNewContext(`class Target { ${method} }; Target`, {
    createShare: async payload => { calls.push(payload); return { bean: { ID: 'share-1', step: 1 } }; },
    notification: { warning() {}, error() {} }
  });
  const target = new Target();
  target.props = { match: { params: { teamName: 'team', regionName: 'region', appID: '1' } } };
  target.state = { overview: { template_id: 'historical-template' } };
  target.setState = () => {};
  target.openDeliveryEditor = destination => { target.destination = destination; };
  target.canPublishSnapshotVersion = () => true;
  target.buildPublishQuery = () => '';
  target.navigateToPublishStep = id => { target.record = id; };
  return { target, calls };
}

test('publishing the running application opens the new editor without creating a snapshot share record', async () => {
  const { target, calls } = publishBridge();
  await target.createPublishRecord('', {}, '', '');
  assert.equal(target.destination, 'local');
  assert.equal(calls.length, 0);
});

test('legacy snapshot publish entry redirects to independent current-application template creation', async () => {
  const { target, calls } = publishBridge();
  await target.createPublishRecord('', {}, '1.2.0', 'historical-snapshot-template');
  assert.equal(calls.length, 0);
  assert.equal(target.destination, 'local');
});

function mergedEditor() {
  const source = fs.readFileSync(`${__dirname}/../pages/Group/Delivery/index.js`, 'utf8');
  const ast = require('@babel/parser').parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = declaration.body.body.filter(node => node.key && ['loadConfigs', 'change', 'next', 'startSync', 'publish'].includes(node.key.name));
  const Target = vm.runInNewContext(`class Target { ${methods.map(node => source.slice(node.start, node.end)).join('\n')} }; Target`, { validateTemplateInfo, canPublishTemplate: () => true });
  const target = new Target(), requests = [];
  target.generation = 0;
  target.pendingConfigs = new Set();
  target.active = generation => generation === target.generation;
  target.scope = () => scope;
  target.state = { components: [component, { ...component, service_id: 'api' }], configs: {},
    values: { ...values }, failedConfigs: [], syncJob: null, errors: {} };
  target.setState = (update, callback) => {
    target.state = { ...target.state, ...(typeof update === 'function' ? update(target.state) : update) };
    if (callback) callback();
  };
  target.props = { match: { params: {} }, user: { user_id: 1 }, dispatch: request => requests.push(request) };
  return { target, requests };
}

test('merged-stage selection changes reuse pending loads and ignore failures for deselected components', () => {
  const { target, requests } = mergedEditor();
  target.loadConfigs();
  target.change('service_ids', ['web', 'api']);
  assert.equal(requests.length, 2, 'the pending web request must not be sent twice');
  target.change('service_ids', ['api']);
  requests[0].onError();
  assert.equal(target.state.failedConfigs.length, 0, 'a deselected component cannot block the selected configuration');
  requests[1].callback({ ...config(), service_id: 'api' });
  assert.equal(target.state.loadingConfigs, false);
  target.change('service_ids', ['web', 'api']);
  assert.equal(requests.length, 3, 'only the failed component needs another load');
  requests[2].callback(config());
  assert.equal(target.state.loadingConfigs, false);
  assert.ok(target.state.configs.web && target.state.configs.api);
});

test('callbacks from a previous application cannot clear the current configuration load', () => {
  const { target, requests } = mergedEditor();
  target.loadConfigs();
  target.generation += 1;
  target.pendingConfigs.clear();
  target.loadConfigs();
  requests[0].callback(config());
  assert.equal(target.pendingConfigs.has('web'), true);
  assert.equal(target.state.configs.web, undefined);
  requests[1].callback(config());
  assert.equal(target.state.loadingConfigs, false);
});

test('next validates metadata and component settings before starting synchronization directly', () => {
  const { target, requests } = mergedEditor();
  target.configEditor = { validate: () => false };
  target.next();
  assert.equal(requests.length, 0);
  target.configEditor.validate = () => true;
  target.next();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].type, 'templateDelivery/synchronize');
  assert.equal(requests[0].payload.operation, 'start');
  target.next();
  assert.equal(requests.length, 1, 'repeated clicks cannot start another task');
  requests[0].onError('syncUnavailable');
  target.state.values.template_name = '';
  target.next();
  assert.equal(target.state.errors.template_name, 'nameRequired');
  assert.equal(requests.length, 1);
});

test('publishing requires successful synchronization and passes its identity only once', () => {
  const { target, requests } = mergedEditor();
  target.publish();
  assert.equal(requests.length, 0);
  target.state.syncJob = { id: 'sync-1', status: 'syncing' };
  target.publish();
  assert.equal(requests.length, 0);
  target.state.syncJob.status = 'success';
  target.publish();target.publish();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].payload.options.sync_id, 'sync-1');
});
