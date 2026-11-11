const assert = require('assert');
const { test } = require('node:test');
const {
  getEnabledVMServiceNames,
  getServiceClusterIP,
  readVMInternalAddress,
  buildVMPortManagementRoute
} = require('./vmNetworkHelpers');

assert.deepStrictEqual(
  getEnabledVMServiceNames([
    { is_inner_service: false, k8s_service_name: 'vm-demo' },
    { is_inner_service: true, k8s_service_name: 'vm-demo' },
    { is_inner_service: true, k8s_service_name: 'vm-demo' },
    { is_inner_service: true, k8s_service_name: '' }
  ]),
  ['vm-demo'],
  'should return unique service names only for enabled internal ports'
);

assert.deepStrictEqual(
  getEnabledVMServiceNames([
    { is_inner_service: false, k8s_service_name: 'vm-demo' }
  ]),
  [],
  'should hide cluster ip when no internal port is enabled'
);

assert.strictEqual(
  getServiceClusterIP({ spec: { clusterIP: '10.43.12.9' } }),
  '10.43.12.9',
  'should read cluster ip from service spec'
);

assert.strictEqual(
  getServiceClusterIP({ spec: { clusterIP: 'None' } }),
  '',
  'should ignore headless services'
);

console.log('vm network helper tests passed');

const context = { teamName: 'team-a', regionName: 'region-a', appId: '868', serviceAlias: 'vm-a' };
const ok = data => ({ status_code: 200, business_code: 200, ...data });
const internalPort = { is_inner_service: true, k8s_service_name: 'vm-service' };

function readers(ports = ok({ list: [internalPort] }), service = ok({ bean: { spec: { clusterIP: '10.43.12.9' } } })) {
  const calls = [];
  return {
    calls,
    api: {
      getPorts: async options => { calls.push({ method: 'ports', options }); return ports; },
      getNsResource: async options => {
        calls.push({ method: 'service', options });
        if (typeof service === 'function') return service(options);
        return service;
      }
    }
  };
}

test('no enabled internal ports is distinct from a failed port read', async () => {
  const empty = readers(ok({ list: [{ is_inner_service: false, k8s_service_name: 'external-only' }] }));
  assert.deepStrictEqual(await readVMInternalAddress(context, empty.api), { status: 'no-inner-ports', clusterIP: '' });
  assert.deepStrictEqual(empty.calls.map(call => call.method), ['ports']);
  for (const response of [undefined, {}, { status_code: 500, list: [] }, { status_code: 200, business_code: 403, list: [] }]) {
    const { api } = readers();
    api.getPorts = async () => response;
    assert.equal((await readVMInternalAddress(context, api)).status, 'read-failed');
  }
});

test('an internal declaration without a Service name waits without querying an invented resource', async () => {
  const { api, calls } = readers(ok({ list: [{ is_inner_service: true, k8s_service_name: '' }] }));
  assert.deepStrictEqual(await readVMInternalAddress(context, api), { status: 'service-pending', clusterIP: '' });
  assert.equal(calls.length, 1);
});

test('existing Services without a ClusterIP or headless Services are pending', async () => {
  for (const bean of [{}, { spec: {} }, { spec: { clusterIP: 'None' } }]) {
    assert.equal((await readVMInternalAddress(context, readers(undefined, ok({ bean })).api)).status, 'service-pending');
  }
});

test('a swallowed Service 404 and a thrown 404 both remain pending', async () => {
  for (const service of [
    options => { options.handleError({ response: { status: 404 } }); return undefined; },
    () => { throw Object.assign(new Error('missing resource'), { response: { status: 404 } }); },
    { status_code: 404 }
  ]) {
    assert.equal((await readVMInternalAddress(context, readers(undefined, service).api)).status, 'service-pending');
  }
});

test('permission, transport and other server failures do not look like unconfigured ports', async () => {
  for (const service of [
    () => undefined,
    options => { options.handleError({ response: { status: 403 } }); return undefined; },
    () => { throw new Error('transport failed'); },
    { status_code: 500 }
  ]) {
    assert.equal((await readVMInternalAddress(context, readers(undefined, service).api)).status, 'read-failed');
  }
});

test('a ready address comes from the requested cluster Service and makes only reads', async () => {
  const { api, calls } = readers();
  assert.deepStrictEqual(await readVMInternalAddress(context, api), { status: 'ready', clusterIP: '10.43.12.9' });
  assert.deepStrictEqual(calls.map(call => call.method), ['ports', 'service']);
  assert.deepStrictEqual(calls[1].options, {
    team: 'team-a', region: 'region-a', name: 'vm-service', group: '', version: 'v1', resource: 'services',
    showLoading: false, handleError: calls[1].options.handleError
  });
});

test('another declared Service can supply its address while one is still pending', async () => {
  const { api } = readers(ok({ list: [internalPort, { is_inner_service: true, k8s_service_name: 'second' }] }), options =>
    ok({ bean: options.name === 'second' ? { spec: { clusterIP: '10.43.12.10' } } : {} }));
  assert.deepStrictEqual(await readVMInternalAddress(context, api), { status: 'ready', clusterIP: '10.43.12.10' });
});

test('invalidating the read while ports are pending prevents the next Service read', async () => {
  let resolvePorts;
  let active = true;
  let serviceReads = 0;
  const pending = readVMInternalAddress(context, {
    getPorts: () => new Promise(resolve => { resolvePorts = resolve; }),
    getNsResource: () => { serviceReads += 1; }
  }, () => active);
  active = false;
  resolvePorts(ok({ list: [internalPort] }));
  assert.equal(await pending, null);
  assert.equal(serviceReads, 0);
});

test('the configure action targets the VM Network tab', () => {
  assert.equal(buildVMPortManagementRoute({ ...context, refresh: 'next value' }),
    '/team/team-a/region/region-a/apps/868/overview?type=components&componentID=vm-a&tab=port&refresh=next%20value');
  assert.equal(buildVMPortManagementRoute({ ...context, appId: '' }), '');
});
