const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { normalizeTemplateConfig } = require('./templateDelivery');
const scope = { enterprise_id: 'enterprise', teamName: 'team', regionName: 'region', appID: '1' };
function harness(file, names) {
  const calls = [];
  const context = { require, apiconfig: { baseUrl: '' }, request: async (url, options) => {
    calls.push({ url, options });return { bean: { id: 'server-id' } };
  } };
  const source = fs.readFileSync(`${__dirname}/../services/${file}.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const service = vm.runInNewContext(`(function(){${source};return {${names.join(',')}};})()`, context);
  return { service, calls };
}
test('sync creation submits component overrides and a request key without snapshot identity', async () => {
  const { service, calls } = harness('templateSync', ['startTemplateSync']);
  await service.startTemplateSync({ scope, requestId: 'request-1', values: { template_name: 'App', version: '1.0.0', service_ids: ['web'] },
    configs: { web: normalizeTemplateConfig({ service_id: 'web' }, [{ attr_name: 'MODE', attr_value: 'test' }]) }, options: { destination: 'local' } });
  assert.match(calls[0].url, /delivery-templates\/sync$/);
  assert.equal(calls[0].options.data.request_id, 'request-1');
  assert.equal(calls[0].options.data.region_name, 'region');
  assert.equal(calls[0].options.data.component_overrides[0].service_env_map_list[0].attr_value, 'test');
  assert.equal('snapshot_id' in calls[0].options.data, false);
});
test('status, retry, cancel and logs use the persistent server task with the same region', async () => {
  const { service, calls } = harness('templateSync', ['getTemplateSync', 'retryTemplateSync', 'cancelTemplateSync', 'loadTemplateSyncLogs']);
  const args = { scope, syncId: 'job-1', serviceId: 'web' };
  await service.getTemplateSync(args);await service.retryTemplateSync(args);await service.cancelTemplateSync(args);await service.loadTemplateSyncLogs(args);
  assert.deepEqual(calls.map(call => call.options.method), ['get', 'post', 'delete', 'get']);
  assert.ok(calls.every(call => call.options.params.region_name === 'region'));
  assert.match(calls[3].url, /job-1\/components\/web\/logs$/);
});
test('creation submits metadata and component overrides without requiring a synchronization task', async () => {
  const { service, calls } = harness('templateDelivery', ['publishDeliveryTemplate', 'deleteDeliveryVersion']);
  await service.publishDeliveryTemplate({ scope, requestId: 'create-one', values: { template_name: 'Application', template_description: 'Summary',
    logo: '/uploads/logo.png', description: 'Release notes', version: '1.0.0', service_ids: ['web'] },
    configs: { web: normalizeTemplateConfig({ service_id: 'web' }, [{ attr_name: 'MODE', attr_value: 'test' }]) } });
  const data = calls[0].options.data;
  assert.equal(data.request_id, 'create-one');
  assert.equal(data.logo, undefined);
  assert.equal(data.template_description, undefined);
  assert.equal(data.template_name, undefined);
  assert.equal(data.component_overrides[0].service_env_map_list[0].attr_value, 'test');
  assert.equal(data.sync_id, undefined);
  assert.equal(data.snapshot_id, undefined);
  await service.deleteDeliveryVersion({ scope, templateId: 'version-1' });
  assert.match(calls[1].url, /versions\/version-1$/);

});
test('listing, install, offline export and admin review use separate real endpoints', async () => {
  const { service, calls } = harness('deliveryCenter', ['actOnDelivery']);
  const args = { scope, template: { id: 'version-1' }, user: { enterprise_id: 'enterprise' } };
  await service.actOnDelivery({ ...args, operation: 'listing', reason: 'Release' });
  await service.actOnDelivery({ ...args, operation: 'deploy', kind: 'delivery', target: { team_name: 'team' } });
  await service.actOnDelivery({ ...args, operation: 'deploy', kind: 'offline' });
  await service.actOnDelivery({ ...args, operation: 'review', requestId: 'request-1', decision: 'approved' });
  await service.actOnDelivery({ ...args, operation: 'deploy', kind: 'test', listingId: 'request-1' });
  assert.deepEqual(calls.map(call => call.url.split('/').pop()), ['listing-requests', 'installations', 'exports', 'review', 'test-deployments']);
});

test('template metadata reuses existing app-model create and edit endpoints with source association', async () => {
  const { service, calls } = harness('market', ['createAppModel', 'upAppModel']);
  const source = { team_name: 'team', region_name: 'region', app_id: '123' };
  await service.createAppModel({ enterprise_id: 'enterprise', name: 'Template', pic: '/uploads/logo.png', describe: 'Purpose',
    scope: 'team', team_name: 'team', delivery_source: source });
  await service.upAppModel({ enterprise_id: 'enterprise', app_id: 'template-id', name: 'Updated', scope: 'team',
    create_team: 'team', delivery_source: source });
  assert.equal(calls[0].url, '/console/enterprise/enterprise/app-models');
  assert.equal(calls[1].url, '/console/enterprise/enterprise/app-model/template-id');
  assert.equal(calls[1].options.method, 'PUT');
  assert.deepEqual(calls[0].options.data.delivery_source, source);
  await service.createAppModel({ enterprise_id: 'enterprise', name: 'Original catalog template', scope: 'enterprise' });
  assert.equal(calls[2].options.data.delivery_source, undefined);
});
