const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const create = require('../../utils/vmSnapshotCreate');
const reads = require('../../utils/vmSnapshotRead');

function load(relative, dependencies) {
  const filename = path.resolve(__dirname, '../..', relative);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { filename, babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]] }).code;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency ${name}`);
  } }, { filename });
  return exports;
}
const attempt = () => ({ request_id: 'request-one', name: 'point-a', power_after: 'previous', description: 'Before update' });
const job = (extra = {}) => ({ operation_id: 'request-one', request_id: 'request-one', kind: 'snapshot',
  phase: 'pending', revision: 1, retry_count: 0, retry_at: 0, error_code: '', complete: false, ...extra });
const accepted = () => ({ status_code: 202, business_code: 202, bean: job() });
const matched = (extra = {}) => ({ status_code: 200, business_code: 200, bean: job(extra) });
function storage() {
  const map = new Map();
  return { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key), map };
}
async function execute(iterator) {
  let step = iterator.next();
  while (!step.done) {
    try { step = iterator.next(await step.value.fn(...step.value.args)); } catch (error) { step = iterator.throw(error); }
  }
}
function harness(extra = {}) {
  const requests = [], memory = storage();
  const h = { requests, memory, response: accepted, storage: memory };
  const services = load('services/vmSnapshots.js', { '../../config/api.config': { baseUrl: '' },
    '../utils/vmSnapshotRead': reads, '../utils/vmSnapshotCreate': create,
    '../utils/request': (url, options) => { requests.push({ url, options }); return h.response(url, options); } });
  const model = load('models/vmSnapshotReads.js', { '../services/vmSnapshots': services,
    '../utils/vmSnapshotRead': reads, '../utils/vmSnapshotCreate': create,
    '../utils/vmExistingSnapshotCapability': require('../../utils/vmExistingSnapshotCapability') }).default;
  const Component = load('pages/Component/VmSnapshotCreate.js', { react: React,
    antd: { Alert: 'Alert', Button: 'Button', Input: { TextArea: 'TextArea' }, Modal: 'Modal', Select: { Option: 'Option' } },
    '@/utils/intl': { formatMessage: ({ id }) => id }, '../../utils/vmSnapshotCreate': create }).VmSnapshotCreate;
  const props = { context: { team: 'team-a', region: 'region-a', application: '42', alias: 'vm-a', serviceId: 'service-a' },
    actorId: 17, enabled: true, capabilityReady: true, storage: memory,
    requestId: () => 'request-one', onAccepted: () => {}, dispatch: action => execute(model.effects[action.type.split('/')[1]](action,
      { call: (fn, ...args) => ({ fn, args }) })), ...extra };
  h.Component = Component;h.props = props;
  h.mount = () => {
    const panel = new Component(props);panel.setState = (change, callback) => { panel.state = { ...panel.state, ...change };if (callback) callback(); };
    panel.componentDidMount();h.panel = panel;return panel;
  };
  h.mount();return h;
}

test('canonical durable job acceptance is distinct from Go or same-name snapshot readiness', () => {
  const result = create.readSnapshotEnqueue(accepted(), attempt());
  assert.equal(result.state, 'accepted');assert.equal(result.complete, false);assert.equal(result.job.phase, 'pending');
  for (const response of [{ ...accepted(), status_code: 200 }, { ...accepted(), bean: job({ request_id: 'other' }) },
    { ...accepted(), bean: job({ operation_id: 'other' }) }, { ...accepted(), bean: job({ complete: true }) }]) {
    assert.throws(() => create.readSnapshotEnqueue(response, attempt()));
  }
  assert.throws(() => create.readSnapshotJob(matched({ kind: 'restore' }), attempt()));
  const missing = matched();delete missing.bean.request_id;
  assert.throws(() => create.readSnapshotJob(missing, attempt()));
  const safe = create.readSnapshotJob(matched({ core_hash: 'private-fixture', lease_owner: 'private-fixture' }), attempt());
  assert.equal(JSON.stringify(safe).includes('private-fixture'), false);
});

test('immutable browser attempt survives reload and remains actor/component bound', () => {
  const memory = storage();create.saveSnapshotAttempt(memory, 'scope-a', attempt());
  assert.equal(create.loadSnapshotAttempt(memory, 'scope-a').request_id, 'request-one');
  assert.throws(() => create.saveSnapshotAttempt(memory, 'scope-a', { ...attempt(), request_id: 'different' }));
  assert.throws(() => create.saveSnapshotAttempt(memory, 'scope-a', { ...attempt(), description: 'Changed' }));
  assert.equal(create.loadSnapshotAttempt(memory, 'other'), null);
  assert.throws(() => create.loadSnapshotAttempt({ getItem() { throw new Error('denied'); } }, 'scope-a'));
  for (const payload of [{ ...attempt(), request_id: 'UPPER' }, { ...attempt(), request_id: 'a'.repeat(64) },
    { ...attempt(), name: '../bad' }, { ...attempt(), power_after: 'running' }, { ...attempt(), description: '界'.repeat(684) }]) {
    assert.throws(() => create.validateSnapshotPrepare(payload));
  }
});

test('real panel/model/service posts only enqueue then reads the existing canonical job status path', async () => {
  const h = harness();h.panel.setState({ name: 'point-a', description: 'Before update' });
  await h.panel.submit();
  assert.equal(h.requests.length, 1);assert.equal(h.requests[0].options.method, 'post');
  assert.equal(h.requests[0].url, '/console/teams/team-a/apps/vm-a/vm-snapshots');
  assert.equal(h.panel.state.status, 'accepted');assert.equal(h.memory.map.size, 1);
  await h.panel.submit();assert.equal(h.requests.length, 1);
  h.response = matched;await h.panel.readback();
  assert.equal(h.requests[1].options.method, 'get');
  assert.equal(h.requests[1].url, '/console/teams/team-a/apps/vm-a/vm-jobs/request-one');
  assert.equal(h.panel.state.status, 'accepted');assert.equal(h.memory.map.size, 1);
  h.response = () => matched({ phase: 'runtime_verified', complete: true, fence_owned: false, fence_cleared: false });
  await h.panel.readback();
  assert.equal(h.panel.state.status, 'completed');assert.equal(h.memory.map.size, 0);
  assert.equal(h.requests.filter(x => x.options.method === 'post').length, 1, 'completion never causes a new POST or Region release');
});

test('unknown survives remount; same-name ready or a query-echo alias cannot settle a different operation', async () => {
  const h = harness();h.response = () => { throw new Error('lost local response'); };
  h.panel.setState({ name: 'point-a' });await h.panel.submit();
  assert.equal(h.panel.state.status, 'unknown');assert.equal(h.requests.length, 1);
  h.panel.componentWillUnmount();h.mount();await h.panel.submit();assert.equal(h.requests.length, 1);
  h.response = () => matched({ operation_id: 'other', observation: { snapshot_name: 'point-a', phase: 'ready',
    ready_to_use: true, manifest_acked: true, finalized: true, error_code: '' } });
  await h.panel.readback();assert.equal(h.panel.state.status, 'unknown');assert.equal(h.memory.map.size, 1);
});

test('capability/actor/persistence and stale callbacks are guarded without weakening the original pending record', async () => {
  for (const extra of [{ capabilityReady: false }, { enabled: false }, { actorId: null }]) {
    const h = harness(extra);h.panel.setState({ name: 'point-a' });await h.panel.submit();assert.equal(h.requests.length, 0);
  }
  const denied = harness({ storage: { getItem() { throw new Error('unavailable'); } } });
  denied.panel.setState({ name: 'point-a' });await denied.panel.submit();assert.equal(denied.requests.length, 0);
  const h = harness();let done;h.response = () => new Promise(resolve => { done = resolve; });
  h.panel.setState({ name: 'point-a' });const pending = h.panel.submit();h.panel.componentWillUnmount();done(accepted());await pending;
  assert.equal(h.memory.map.size, 1);assert.notEqual(h.panel.state.status, 'accepted');
});

test('only explicit pre-enqueue rejection permits a later manual action; SQL uncertainty preserves the request', async () => {
  for (const [status, code, expected, kept] of [[503, 'vm_snapshot_worker_unavailable', 'workerUnavailable', 0],
    [503, 'vm_snapshot_enqueue_outcome_unknown', 'unknown', 1], [409, 'vm_snapshot_job_conflict', 'unknown', 1],
    [422, 'vm_snapshot_storage_unsupported', 'unsupported', 0]]) {
    const h = harness();h.response = (_url, options) => { options.handleError({ status_code: status, bean: { error: { code } } });return undefined; };
    h.panel.setState({ name: 'point-a' });await h.panel.submit();
    assert.equal(h.panel.state.status, expected);assert.equal(h.memory.map.size, kept);assert.equal(h.requests.length, 1);
  }
});

test('actual shared request.js preserves durable202 and the exact pre-enqueue error class', async () => {
  let reply = { status: 202, data: { code: 202, data: { bean: accepted().bean } } };const captured = [];
  const axios = options => { captured.push(options);return Promise.resolve({ ...reply, config: options }); };
  axios.defaults = {};axios.isCancel = () => false;const noop = () => {};
  const request = load('utils/request.js', { antd: { notification: { warning: noop, error: noop }, Modal: { confirm: noop } }, axios,
    '../utils/global': { getCurrTeamName: () => 'team-a', getCurrRegionName: () => 'region-a' }, './cookie': { get: () => '' },
    './error': noop, './token': { updateRenewedTokenFromResponse: noop }, '@/utils/intl': { formatMessage: ({ id }) => id },
    umi: { history: { push: noop }, getDvaApp: () => null },
    '../sentry': { captureRequestError: noop, finishSlowRequestTracking: noop, startSlowRequestTracking: noop },
    '../posthog': { captureErrorViewed: noop }, './requestSlowTelemetry': require('../../utils/requestSlowTelemetry'),
    './marketInstallPreflight': { renderPreflightContent: noop } }).default;
  const services = load('services/vmSnapshots.js', { '../../config/api.config': { baseUrl: '' },
    '../utils/vmSnapshotRead': reads, '../utils/vmSnapshotCreate': create, '../utils/request': request });
  const input = { ...attempt(), team_name: 'team-a', region_name: 'region-a', app_alias: 'vm-a' };
  const value = await services.enqueueVMSnapshot(input, noop, () => true);
  assert.equal(create.readSnapshotEnqueue(value, input).job.kind, 'snapshot');
  assert.equal(captured[0].headers.X_REGION_NAME, 'region-a');assert.equal(captured[0].headers.X_TEAM_NAME, 'team-a');
  reply = { status: 503, data: { code: 503, data: { bean: { error: { code: 'vm_snapshot_worker_unavailable' } } } } };
  let failure;await services.enqueueVMSnapshot(input, error => { failure = create.snapshotPrepareError(error); }, () => true);
  assert.equal(failure.kind, 'rejected');assert.equal(failure.code, 'vm_snapshot_worker_unavailable');assert.equal(captured.length, 2);
});
