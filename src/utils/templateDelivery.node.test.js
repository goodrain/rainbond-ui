const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { normalizeTemplateConfig, validateTemplateConfig, validateTemplateInfo, validateVersionInfo, buildTemplatePayload,
  deliveryScope, appendTemplateRecord } = require('./templateDelivery');
const scope = { enterprise_id: 'enterprise', teamName: 'team', regionName: 'region', appID: '1' };
const component = { service_id: 'web', service_alias: 'web', name: 'Web', extend_method_map: { min_node: 1, max_node: 3, step_node: 1 } };
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

test('private environment defaults stay server-side without becoming mandatory installation parameters', () => {
  const row = normalizeTemplateConfig(component, [{ attr_name: 'DEPLOY_SECRET', attr_value: '$DEPLOY_VALUE' }], { current_cpu: 100, current_memory: 128 });
  assert.equal(row.service_env_map_list[0].attr_value, '');
  row.service_env_map_list[0].attr_value = '$INSTALL_VALUE';
  const result = buildTemplatePayload(values, { web: row }, { destination: 'local' });
  assert.deepEqual(result.component_overrides[0].service_env_map_list[0], {
    attr_name: 'DEPLOY_SECRET', attr_value: '', is_sensitive: true
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

test('creation remains private while platform plugin metadata is validated and normalized', () => {
  assert.equal(validateTemplateInfo(values, true, {}).plugin_id, 'pluginRequired');
  const result = buildTemplatePayload(values, { web: config() }, { destination: 'market', market_id: 'store', pluginEnabled: true,
    plugin: { plugin_id: 'plugin', plugin_name: 'Plugin', plugin_type: 'JSInject', entry_path: '/static/main.js', inject_position: ['NoInject'], route_path: 'settings' } });
  assert.deepEqual(result.plugin.inject_position, []);
  assert.equal(result.market_id, undefined);
  assert.equal(result.destination, undefined);
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
  assert.equal(result.bean.extend_method_map.max_node, 3, 'source template defaults must be preserved');
  assert.equal(result.bean.extend_method_map.step_node, 1);
});

test('snapshots retain rollback without restoring the old direct publication flow', () => {
  const source = fs.readFileSync(`${__dirname}/../pages/AppVersion/index.js`, 'utf8');
  assert.ok(source.includes('renderRollbackRecordsDrawer'));
  assert.ok(source.includes('handleCreateSnapshot'));
  assert.doesNotMatch(source, /renderPublishAction|createPublishRecord/);
});

function mergedEditor() {
  const source = fs.readFileSync(`${__dirname}/../pages/Group/Delivery/index.js`, 'utf8');
  const ast = require('@babel/parser').parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = declaration.body.body.filter(node => node.key && ['load', 'loadConfigs', 'change', 'next', 'publish'].includes(node.key.name));
  const Target = vm.runInNewContext(`class Target { ${methods.map(node => source.slice(node.start, node.end)).join('\n')} }; Target`, { validateVersionInfo, canPublishTemplate: () => true });
  const target = new Target(), requests = [];
  target.generation = 0;
  target.pendingConfigs = new Set();
  target.active = generation => generation === target.generation;
  target.scope = () => scope;
  target.state = { components: [component, { ...component, service_id: 'api' }], configs: {},
    values: { version: values.version, description: values.description, service_ids: values.service_ids.slice() }, failedConfigs: [], syncJob: null, errors: {} };
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

test('version creation validates version and component settings then saves directly without synchronization', () => {
  const { target, requests } = mergedEditor();
  target.configEditor = { validate: () => false };
  target.next();
  assert.equal(requests.length, 0);
  target.configEditor.validate = () => true;
  target.next();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].type, 'templateDelivery/publish');
  assert.equal(requests[0].payload.options.sync_id, undefined);
  assert.equal(requests[0].payload.values.version, values.version);
  assert.equal(requests[0].payload.values.template_name, undefined);
  target.next();
  assert.equal(requests.length, 1, 'repeated clicks cannot start another task');
  requests[0].onError('publishFailed');
  target.state.values.version = '';
  target.next();
  assert.equal(target.state.errors.version, 'versionInvalid');
  assert.equal(requests.length, 1);
});

test('creation preserves a retry key for the same input and never requires a sync id', () => {
  const { target, requests } = mergedEditor();
  target.publish();target.publish();
  assert.equal(requests.length, 1);
  const key = requests[0].payload.requestId;
  assert.ok(key);
  requests[0].onError('publishFailed');
  target.publish();
  assert.equal(requests[1].payload.requestId, key);
  requests[1].onError('publishFailed');
  target.state.values.description = 'New release notes';
  target.publish();
  assert.notEqual(requests[2].payload.requestId, key);
  assert.equal(requests[2].payload.options.sync_id, undefined);
});

test('application metadata and long release notes are separate fields', () => {
  const notes = 'New features and fixes\n'.repeat(500);
  const row = buildTemplatePayload({ ...values, logo: '/uploads/app.png', template_description: 'Application summary', description: notes }, { web: config() });
  assert.equal(row.logo, '/uploads/app.png');
  assert.equal(row.template_description, 'Application summary');
  assert.equal(row.description, notes.trim());
  assert.equal(validateTemplateInfo({ ...values, description: 'x'.repeat(20001) }).description, 'descriptionLimit');
});

test('version payload excludes template metadata and validates only version content', () => {
  const result = buildTemplatePayload({ version: '2.0.0', description: 'Version notes', service_ids: ['web'],
    template_name: 'stale name', logo: '/uploads/stale.png', template_description: 'stale metadata' }, { web: config() }, { versionOnly: true });
  assert.equal(result.template_name, undefined);
  assert.equal(result.logo, undefined);
  assert.equal(result.template_description, undefined);
  assert.equal(result.version, '2.0.0');
  assert.deepEqual(validateVersionInfo({ version: '2.0.0', service_ids: ['web'] }), {});
});

function sourceLoader(bean) {
  const context = { require, apiconfig: { baseUrl: '' }, request: async url => url.endsWith('/source') ? { bean: { apps: [] } } : { bean } };
  const source = fs.readFileSync(`${__dirname}/../services/templateDelivery.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  vm.runInNewContext(source, context);
  return () => context.loadDeliveryComponents(scope);
}
test('existing versions identify the template when the legacy API omits template metadata', async () => {
  const result = await sourceLoader({ items: [{ template_id: 'template-legacy', template_name: 'Existing template',
    manifest: { annotations: { logo: '/uploads/existing.png', describe: 'Existing introduction' } } }], active_syncs: [] })();
  assert.equal(result.bean.template.id, 'template-legacy');
  assert.equal(result.bean.template.name, 'Existing template');
  assert.equal(result.bean.template.logo, '/uploads/existing.png');
});
test('current template metadata remains authoritative and an empty response does not fabricate a template', async () => {
  const result = await sourceLoader({ template: { id: 'current', name: 'Current metadata' }, items: [{ template_id: 'current', template_name: 'Old version title' }] })();
  assert.equal(result.bean.template.name, 'Current metadata');
  assert.equal((await sourceLoader({ items: [] })()).bean.template, null);
});

test('missing template metadata stays on the editor and does not silently navigate away', () => {
  const { target, requests } = mergedEditor();
  target.load();
  requests[0].callback({ template: null, components: [] });
  assert.equal(target.state.loading, false);
  assert.equal(target.state.template, null);
  assert.equal(requests.length, 1);
});

test('normalizing source configuration never invents replica ranges or resource values', () => {
  const row = normalizeTemplateConfig({ service_id: 'missing' }, []);
  assert.equal(row.extend_method_map.min_node, undefined);
  assert.equal(row.extend_method_map.max_node, undefined);
  assert.equal(row.extend_method_map.step_node, undefined);
  assert.equal(row.extend_method_map.container_cpu, undefined);
  assert.equal(row.extend_method_map.init_memory, undefined);
  assert.deepEqual(validateTemplateConfig(row), {});
});


test('empty optional resources are omitted so the server inherits defaults, while zero remains explicit', () => {
  const row = config();
  row.extend_method_map = { min_node: undefined, max_node: null, step_node: '', init_memory: 0, container_cpu: 0 };
  assert.deepEqual(validateTemplateConfig(row), {});
  assert.deepEqual(buildTemplatePayload(values, { web: row }).component_overrides[0].extend_method_map,
    { init_memory: 0, container_cpu: 0 });
  row.extend_method_map.max_node = -1;
  assert.equal(validateTemplateConfig(row).max_node, 'numberInvalid');
  row.extend_method_map.max_node = 1.5;
  assert.equal(validateTemplateConfig(row).max_node, 'numberInvalid');
});
