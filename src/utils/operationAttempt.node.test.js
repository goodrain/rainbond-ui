const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const filename = path.join(__dirname, 'operationAttempt.js');

function loadOperationAttempt({ storage = new Map(), crypto } = {}) {
  const source = fs.readFileSync(filename, 'utf8').replace(/export function /g, 'function ');
  const code = `${source}\nmodule.exports = { createAttemptId, createRequestTelemetryOptions, buildAttemptHeaders, startServiceAttempt, getServiceAttempt, clearServiceAttempt, startComposeAttempt, getComposeAttempt, clearComposeAttempt };`;
  const sessionStorage = {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  };
  const context = { module: { exports: {} }, exports: {}, window: { sessionStorage }, crypto };
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
