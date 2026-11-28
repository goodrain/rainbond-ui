const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const filename = path.join(__dirname, 'operationAttempt.js');

function loadOperationAttempt({ storage = new Map(), crypto, sessionStorage } = {}) {
  const source = fs.readFileSync(filename, 'utf8').replace(/export function /g, 'function ');
  const code = `${source}\nmodule.exports = { createAttemptId, createRequestTelemetryOptions, buildAttemptHeaders, startServiceAttempt, getServiceAttempt, clearServiceAttempt, bindServiceAttempt, startComposeAttempt, getComposeAttempt, clearComposeAttempt, bindComposeAttempt, getDeployType };`;
  const storageApi = sessionStorage || {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  };
  const context = { module: { exports: {} }, exports: {}, window: { sessionStorage: storageApi }, crypto };
  vm.runInNewContext(code, context, { filename });
  return { api: context.module.exports, storage };
}

test('stores and clears service and compose attempts with stable keys', () => {
  const { api } = loadOperationAttempt({ crypto: { getRandomValues: values => values.fill(1) } });
  const serviceId = api.startServiceAttempt({ team_name: 'team', service_cname: '显示名称', k8s_component_name: 'api' });
  assert.match(serviceId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(api.getServiceAttempt({ team_name: 'team', app_alias: 'api' }), serviceId);
  api.clearServiceAttempt({ team_name: 'team', service_alias: 'api' });
  assert.equal(api.getServiceAttempt({ team_name: 'team', app_alias: 'api' }), null);

  const composeId = api.startComposeAttempt({ team_name: 'team', group_id: 'group', compose_id: 'compose' });
  assert.equal(api.getComposeAttempt({ team_name: 'team', group_id: 'group', compose_id: 'compose' }), composeId);
  api.clearComposeAttempt({ team_name: 'team', group_id: 'group', compose_id: 'compose' });
  assert.equal(api.getComposeAttempt({ team_name: 'team', group_id: 'group', compose_id: 'compose' }), null);
});

test('uses getRandomValues fallback and keeps attempt ids out of request bodies', () => {
  const { api } = loadOperationAttempt({ crypto: { getRandomValues: values => values.fill(0) } });
  const attemptId = api.createAttemptId();
  assert.equal(attemptId, '00000000-0000-4000-8000-000000000000');
  assert.equal(api.createRequestTelemetryOptions(attemptId).attemptId, attemptId);
  assert.equal(api.createRequestTelemetryOptions(attemptId).returnErrorMetadata, true);
  assert.equal(api.buildAttemptHeaders(attemptId)['X-Rainbond-Attempt-Id'], attemptId);
});

test('binds backend aliases after creation and maps backend deploy type values', () => {
  const { api } = loadOperationAttempt({ crypto: { getRandomValues: values => values.fill(2) } });
  const attemptId = api.startServiceAttempt({ team_name: 'team', k8s_component_name: 'my-api' });
  api.bindServiceAttempt({ team_name: 'team', service_alias: 'gr12ab34' }, attemptId);
  assert.equal(api.getServiceAttempt({ team_name: 'team', app_alias: 'gr12ab34' }), attemptId);
  api.clearServiceAttempt({ team_name: 'team', app_alias: 'gr12ab34' });
  assert.equal(api.getServiceAttempt({ team_name: 'team', app_alias: 'gr12ab34' }), null);

  const composeAttempt = api.startComposeAttempt({ team_name: 'team' });
  api.bindComposeAttempt({ team_name: 'team', group_id: 'group', compose_id: 'compose-1' }, composeAttempt);
  assert.equal(api.getComposeAttempt({ team_name: 'team', group_id: 'group', compose_id: 'compose-1' }), composeAttempt);
  assert.equal(api.getDeployType({ source_type: 'vm_run' }), 'virtual_machine');
  assert.equal(api.getDeployType({ source_type: 'package_build' }), 'source_code');
  assert.equal(api.getDeployType({ source_type: 'third_party' }), 'image');
  assert.equal(api.getDeployType({ service_source: 'kubeblocks_component' }), 'database');
  assert.equal(api.getDeployType({ service_source: 'future_source' }), 'image');
  assert.equal(api.getDeployType({ service_source: 'docker_run' }), 'image');
  assert.equal(api.getDeployType({ service_source: 'market' }), 'app_market');
});

test('removes the provisional component-name key when a backend alias is bound', () => {
  const { api, storage } = loadOperationAttempt({ crypto: { getRandomValues: values => values.fill(3) } });
  const attemptId = api.startServiceAttempt({ team_name: 'team', k8s_component_name: 'my-api' });
  api.bindServiceAttempt({ team_name: 'team', service_alias: 'gr12ab34' }, attemptId, { team_name: 'team', k8s_component_name: 'my-api' });
  assert.equal(api.getServiceAttempt({ team_name: 'team', k8s_component_name: 'my-api' }), null);
  assert.equal(api.getServiceAttempt({ team_name: 'team', app_alias: 'gr12ab34' }), attemptId);
  assert.equal(storage.size, 1);
});

test('returns safely when sessionStorage access raises SecurityError', () => {
  const { api } = loadOperationAttempt({
    crypto: { getRandomValues: values => values.fill(4) },
    sessionStorage: {
      getItem() { throw new Error('SecurityError'); },
      setItem() { throw new Error('SecurityError'); },
      removeItem() { throw new Error('SecurityError'); }
    }
  });
  assert.doesNotThrow(() => api.startServiceAttempt({ team_name: 'team', k8s_component_name: 'app' }));
  assert.equal(api.getServiceAttempt({ team_name: 'team', app_alias: 'app' }), null);
  assert.doesNotThrow(() => api.clearServiceAttempt({ team_name: 'team', app_alias: 'app' }));
});
