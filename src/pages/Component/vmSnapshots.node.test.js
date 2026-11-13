const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const helpers = require('../../utils/vmSnapshotRead');
const polling = require('./componentPolling');

function load(relative, dependencies, globals = {}) {
  const filename = path.resolve(__dirname, '../..', relative);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { filename, babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]] }).code;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency ${name}`);
  }, ...globals }, { filename });
  return exports;
}
function item(name = 'point-a', overrides = {}) {
  return { snapshot_name: name, description: 'Before update', phase: 'creating', ready_to_use: false, consistency: 'offline',
    manifest_acked: false, finalized: false, cancelled: false, deleted: false,
    coverage: { complete: false, expected_writable_disks: 1, included_disks: 0, missing_disk_keys: ['root'], excluded_read_only: [] },
    disks: [], ...overrides };
}
const ok = bean => ({ status_code: 200, business_code: 200, bean });
const list = (items = [item()], extra = {}) => ok({ items, page: 1, page_size: 20, total: items.length, ...extra });
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
async function execute(iterator) {
  let step = iterator.next();
  while (!step.done) {
    try { step = iterator.next(await step.value.fn(...step.value.args)); }
    catch (error) { step = iterator.throw(error); }
  }
  return step.value;
}
function harness() {
  const scope = { team: 'team-a', region: 'region-a', application: '42', alias: 'vm-a', serviceId: 'service-a' };
  const requests = [], actions = [], pending = [], timers = new Map(), listeners = new Set();
  let timerId = 0;
  const document = { hidden: false, addEventListener: (_, callback) => listeners.add(callback), removeEventListener: (_, callback) => listeners.delete(callback) };
  const h = { scope, requests, actions, pending, timers, listeners, document,
    request: async url => url.includes('/vm-snapshots/') ? ok(item()) : list() };
  const services = load('services/vmSnapshots.js', {
    '../../config/api.config': { baseUrl: '' }, '../utils/vmSnapshotRead': helpers,
    '../utils/request': (url, options) => { requests.push({ url, options }); return h.request(url, options); }
  });
  h.services = services;
  const model = load('models/vmSnapshotReads.js', { '../services/vmSnapshots': services, '../utils/vmSnapshotRead': helpers }).default;
  const globalUtil = { getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region,
    getAppID: () => scope.application, getSlidePanelComponentID: () => scope.alias };
  const Component = load('pages/Component/VmSnapshots.js', {
    react: React, antd: { Alert: 'Alert', Badge: 'Badge', Button: 'Button', Card: 'Card', Descriptions: { Item: 'D' }, Empty: 'Empty', Spin: 'Spin', Table: 'Table' },
    dva: { connect: () => component => component }, '@/utils/intl': { formatMessage: ({ id }) => id },
    '@/utils/global': globalUtil, '../../utils/vmSnapshotRead': helpers, './componentPolling': polling
  }, { document, setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; }, clearTimeout: id => timers.delete(id) }).VmSnapshots;
  const panel = new Component({ context: { ...scope }, pollingEnabled: true, dispatch: action => {
    actions.push(action);
    const read = execute(model.effects[action.type.split('/')[1]](action, { call: (fn, ...args) => ({ fn, args }) }));
    pending.push(read);
    return read;
  } });
  panel.setState = (change, callback) => { panel.state = { ...panel.state, ...change }; if (callback) callback(); };
  h.panel = panel;
  h.settle = async () => { await pending[pending.length - 1]; };
  h.mount = async () => { panel.componentDidMount(); await h.settle(); };
  h.advance = async () => {
    const [id, timer] = timers.entries().next().value;
    timers.delete(id); timer.callback(); await h.settle(); return timer.delay;
  };
  h.update = async changes => { const previous = panel.props; panel.props = { ...previous, ...changes }; panel.componentDidUpdate(previous); await h.settle(); };
  h.hide = hidden => { document.hidden = hidden; listeners.forEach(listener => listener()); };
  return h;
}
function elements(element) {
  if (Array.isArray(element)) return element.flatMap(elements);
  if (!element || typeof element !== 'object') return [];
  return [element, ...elements(element.props?.children), ...elements(element.props?.description), ...elements(element.props?.extra)];
}

test('the real panel/model/service chain reads the frozen list and detail envelope using captured scope', async () => {
  const h = harness();
  h.request = async url => url.includes('/vm-snapshots/') ? ok(item('point-a', {
    ready_to_use: true, phase: 'ready', receipt: { secret: 'private' }, source_pvc: 'physical', core_hash: 'private',
    config: { cpu_milli: 2000, memory_mib: 2048, boot_mode: 'uefi', disk_layout: [], cloud_init: 'private' }
  })) : list([item('point-a', { snapshot_resources: ['physical'], native_proof_hash: 'private' })]);
  await h.mount();
  assert.equal(h.panel.state.listStatus, 'ready');
  assert.equal(h.requests[0].url, '/console/teams/team-a/apps/vm-a/vm-snapshots');
  assert.equal(h.requests[0].options.method, 'get');
  assert.equal(h.requests[0].options.data.team_name, 'team-a');
  assert.equal(h.requests[0].options.data.region_name, 'region-a');
  assert.equal(h.requests[0].options.params.region_name, 'region-a');
  assert.equal(h.requests[0].options.params.page_size, 20);
  h.panel.select(true, h.panel.state.items[0]); await h.settle();
  assert.equal(h.requests[1].url, '/console/teams/team-a/apps/vm-a/vm-snapshots/point-a');
  assert.equal(h.panel.state.detail.ready_to_use, true);
  assert.equal(h.panel.state.detail.manifest_acked, false);
  assert.equal(h.panel.state.detail.finalized, false);
  assert.equal(JSON.stringify(h.panel.state).includes('private'), false);
  assert.equal(JSON.stringify(h.panel.state).includes('physical'), false);
  assert.equal('restorable' in h.panel.state.detail, false);
  assert.equal(elements(h.panel.renderDetail()).filter(node => node.type === 'Button').length, 1, 'details only refresh data');
  h.panel.componentWillUnmount();
});

test('empty, malformed, accepted, unsupported, forbidden, not found, conflict and read failures remain distinct and retryable by user', async () => {
  for (const [response, expected] of [
    [list([]), 'empty'], [ok({}), 'failed'], [{ status_code: 202, business_code: 202, bean: {} }, 'failed'],
    [{ status_code: 403, business_code: 403 }, 'forbidden'], [{ status_code: 422, business_code: 422 }, 'unsupported'],
    [{ status_code: 200, business_code: 403 }, 'forbidden'],
    [{ status_code: 404, business_code: 404 }, 'notFound'], [{ status_code: 409, business_code: 409 }, 'conflict'],
    [undefined, 'failed']
  ]) {
    const h = harness(); h.request = async () => response; await h.mount();
    assert.equal(h.panel.state.listStatus, expected);
    if (expected !== 'empty') {
      assert.equal(h.panel.state.items, null);
      assert.ok(elements(h.panel.render()).some(node => node.type === 'Alert'));
      h.request = async () => list(); await h.panel.read('list');
      assert.equal(h.panel.state.listStatus, 'ready');
    }
    h.panel.componentWillUnmount();
  }
});

test('contradictory business errors and falsey invalid optional fields never render an empty or successful snapshot', async () => {
  for (const code of ['vm_restore_busy', 'vm_snapshot_dependency_unavailable']) {
    const h = harness(); h.request = async () => list([], { error: { code } }); await h.mount();
    assert.equal(h.panel.state.listStatus, 'failed'); assert.equal(h.panel.state.items, null);
    h.panel.componentWillUnmount();
  }
  for (const invalid of [null, false, 0, [], {}]) {
    const h = harness(); h.request = async () => list([item('point-a', { error_code: invalid })]); await h.mount();
    assert.equal(h.panel.state.listStatus, 'failed'); assert.equal(h.panel.state.items, null);
    h.request = async () => list(); await h.panel.read('list');
    h.request = async () => ok(item('point-a', { error_code: invalid }));
    h.panel.select(true, h.panel.state.items[0]); await h.settle();
    assert.equal(h.panel.state.detailStatus, 'failed'); assert.equal(h.panel.state.detail, null);
    h.panel.componentWillUnmount();
  }
  const h = harness(); h.request = async () => list([item('point-a', { error_code: '' })]); await h.mount();
  assert.equal(h.panel.state.listStatus, 'ready'); h.panel.componentWillUnmount();
});

test('structured HTTP failure callbacks stay safe and recover automatically without parallel intervals', async () => {
  const h = harness();
  h.request = async (_, options) => { options.handleError({ response: { status: 503, data: { data: { bean: {
    error: { code: 'vm_snapshot_dependency_unavailable', retryable: true }, receipt: 'private' } } } } }); return undefined; };
  await h.mount();
  assert.equal(h.panel.state.listStatus, 'failed');
  assert.equal(h.panel.state.listError.code, 'vm_snapshot_dependency_unavailable');
  assert.equal(h.timers.size, 1);
  h.request = async () => list();
  assert.equal(await h.advance(), 10000);
  assert.equal(h.panel.state.listStatus, 'ready');
  assert.equal(h.timers.size, 1);
  h.panel.componentWillUnmount(); assert.equal(h.timers.size, 0);
});

test('late list responses cannot cross team, region, app, component or known service identity', async () => {
  for (const key of ['team', 'region', 'application', 'alias', 'serviceId']) {
    const h = harness(), old = deferred(); h.request = () => old.promise;
    h.panel.componentDidMount();
    const previousRead = h.pending[0];
    const oldRead = h.actions[0].shouldApply;
    h.scope[key] = `new-${key}`;
    h.request = async () => list([item('new-point')]);
    await h.update({ context: { ...h.scope } });
    assert.equal(oldRead(), false);
    old.resolve(list([item('old-point')])); await previousRead;
    assert.equal(h.panel.state.items[0].snapshot_name, 'new-point');
    assert.equal(h.timers.size, 1);
    if (key === 'team' || key === 'region') assert.equal(h.requests[1].options.data[key === 'team' ? 'team_name' : 'region_name'], h.scope[key]);
    h.panel.componentWillUnmount();
  }
});

test('selecting another snapshot or closing detail invalidates an older detail request', async () => {
  const h = harness(), old = deferred();
  h.request = async () => list([item('point-a'), item('point-b')]); await h.mount();
  h.request = url => url.endsWith('point-a') ? old.promise : Promise.resolve(ok(item('point-b')));
  h.panel.select(true, h.panel.state.items[0]);
  const previousDetail = h.pending[h.pending.length - 1];
  h.panel.select(true, h.panel.state.items[1]); await h.settle();
  old.resolve(ok(item('point-a'))); await previousDetail;
  assert.equal(h.panel.state.detail.snapshot_name, 'point-b');
  h.panel.select(false, h.panel.state.items[1]);
  assert.equal(h.panel.state.detail, null);
  assert.equal(h.timers.size, 1, 'only the list poll remains after collapsing');
  const closing = deferred(); h.request = () => closing.promise;
  h.panel.select(true, h.panel.state.items[0]);
  const closingRead = h.pending[h.pending.length - 1];
  h.panel.select(false, h.panel.state.items[0]);
  closing.resolve(ok(item('point-a'))); await closingRead;
  assert.equal(h.panel.state.detail, null); assert.equal(h.timers.size, 1);
  h.panel.componentWillUnmount();
});

test('hide, polling disable and unmount stop timers and invalidate in-flight work; visible resume reads afresh', async () => {
  const h = harness(); await h.mount(); assert.equal(h.listeners.size, 1);
  const old = deferred(); h.request = () => old.promise;
  const pending = h.panel.read('list');
  h.hide(true);
  old.resolve(list([item('old-point')])); await pending;
  assert.equal(h.panel.state.items, null); assert.equal(h.timers.size, 0);
  h.request = async () => list([item('visible-point')]); h.hide(false); await h.settle();
  assert.equal(h.panel.state.items[0].snapshot_name, 'visible-point');
  await h.update({ pollingEnabled: false });
  assert.equal(h.timers.size, 0); assert.equal(h.panel.state.items, null);
  const count = h.requests.length; h.panel.read('list'); assert.equal(h.requests.length, count);
  await h.update({ pollingEnabled: true }); assert.equal(h.timers.size, 1);
  const last = deferred(); h.request = () => last.promise;
  const inFlight = h.panel.read('list'); h.panel.componentWillUnmount();
  last.resolve(list([item('unmounted-point')])); await inFlight;
  assert.equal(h.listeners.size, 0); assert.equal(h.timers.size, 0);
  assert.equal(h.panel.state.items[0].snapshot_name, 'visible-point');
});

test('each read flow admits one request and pagination or changed context invalidates old polling callbacks', async () => {
  const h = harness(), waiting = deferred(); h.request = () => waiting.promise;
  h.panel.componentDidMount();
  for (let i = 0; i < 5; i += 1) h.panel.read('list');
  assert.equal(h.requests.length, 1);
  waiting.resolve(list()); await h.settle();
  const staleTimer = h.timers.values().next().value;
  h.request = async () => list([], { page: 2, total: 1 });
  h.panel.changePage(2, 20); await h.settle();
  const before = h.requests.length; staleTimer.callback();
  assert.equal(h.requests.length, before);
  assert.equal(h.panel.state.page, 2); assert.equal(h.panel.state.listStatus, 'ready');
  assert.equal(h.panel.state.total, 1, 'an empty out-of-range page keeps pagination, not a false no-snapshots state');
  h.panel.componentWillUnmount();
});

test('request boundary refuses dot segments and stale work before issuing HTTP; wrong detail and wrong page never save', async () => {
  const h = harness();
  let callbacks = 0;
  await h.panel.props.dispatch({ type: 'vmSnapshotReads/detail', payload: {}, shouldApply: () => false,
    callback: () => { callbacks += 1; }, handleError: () => { callbacks += 1; } });
  assert.equal(h.requests.length, 0);
  assert.equal(callbacks, 0);
  const context = { team_name: 'team-a', region_name: 'region-a', app_alias: 'vm-a', snapshot_name: 'point-a' };
  assert.equal(h.services.getVMSnapshot(context, () => { callbacks += 1; }, () => false), undefined);
  for (const snapshot_name of ['.', '..', '%2e%2e', 'point/a', ''])
    assert.throws(() => h.services.getVMSnapshot({ ...context, snapshot_name }), /Invalid snapshot read context/);
  assert.equal(h.requests.length, 0);
  await h.mount();
  h.request = async () => ok(item('wrong-point'));
  h.panel.select(true, h.panel.state.items[0]); await h.settle();
  assert.equal(h.panel.state.detailStatus, 'failed'); assert.equal(h.panel.state.detail, null);
  h.request = async () => list([], { page: 2 }); await h.panel.read('list');
  assert.equal(h.panel.state.listStatus, 'failed');
  for (const name of ['.', '..', '%2e%2e', 'point/a', '']) assert.equal(helpers.validSnapshotName(name), false);
  assert.equal(helpers.validSnapshotName('point.a'), true);
  h.panel.componentWillUnmount();
});
