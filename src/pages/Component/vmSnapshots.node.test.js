const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const AntdDescriptions = require('antd/lib/descriptions').default;
const babel = require('@umijs/deps/compiled/babel/core');
const helpers = require('../../utils/vmSnapshotRead');
const polling = require('./componentPolling');
const capabilityHelpers = require('../../utils/vmExistingSnapshotCapability');
const createHelpers = require('../../utils/vmSnapshotCreate');
const restoreHelpers = require('../../utils/vmSnapshotRestore');

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
function currentCapability(extra = {}) {
  return { supported: true, status: 'supported', reason_code: 'ready', message: 'Current mapped A', operation: 'create_snapshot', complete: true,
    volumes: [{ key: 'manual42', disk_key: 'root', role: 'root', read_only: false, supported: true, status: 'supported', reason_code: 'ready', message: 'A verified', storage_class: 'fast' }],
    excluded_volumes: [], ...extra };
}
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function storage() {
  const map = new Map();
  return { map, getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
}
async function execute(iterator) {
  let step = iterator.next();
  while (!step.done) {
    try { step = iterator.next(await step.value.fn(...step.value.args)); }
    catch (error) { step = iterator.throw(error); }
  }
  return step.value;
}
function harness(previousRestoreStorage) {
  const scope = { team: 'team-a', region: 'region-a', application: '42', alias: 'vm-a', serviceId: 'service-a' };
  const restoreStorage = previousRestoreStorage || storage();
  const requests = [], actions = [], pending = [], capabilityRequests = [], capabilityActions = [], capabilityPending = [], timers = new Map(), listeners = new Set();
  let timerId = 0;
  const document = { hidden: false, addEventListener: (_, callback) => listeners.add(callback), removeEventListener: (_, callback) => listeners.delete(callback) };
  const h = { scope, requests, actions, pending, capabilityRequests, capabilityActions, capabilityPending, timers, listeners, document, restoreStorage,
    capabilityRequest: async () => ok(currentCapability()),
    request: async url => url.includes('/vm-snapshots/') ? ok(item()) : list() };
  const services = load('services/vmSnapshots.js', {
    '../../config/api.config': { baseUrl: '' }, '../utils/vmSnapshotRead': helpers, '../utils/vmSnapshotCreate': createHelpers,
    '../utils/vmSnapshotRestore': restoreHelpers,
    '../utils/request': (url, options) => {
      if (url.endsWith('/vm-snapshot-capability')) { capabilityRequests.push({ url, options }); return h.capabilityRequest(url, options); }
      requests.push({ url, options }); return h.request(url, options); }
  });
  h.services = services;
  const model = load('models/vmSnapshotReads.js', { '../services/vmSnapshots': services, '../utils/vmSnapshotRead': helpers,
    '../utils/vmSnapshotCreate': createHelpers, '../utils/vmSnapshotRestore': restoreHelpers,
    '../utils/vmExistingSnapshotCapability': capabilityHelpers }).default;
  const globalUtil = { getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region,
    getAppID: () => scope.application, getSlidePanelComponentID: () => scope.alias };
  const Component = load('pages/Component/VmSnapshots.js', {
    react: React, moment: require('moment'), antd: { Alert: 'Alert', Badge: 'Badge', Button: 'Button', Card: 'Card', Descriptions: { Item: 'D' }, Empty: 'Empty', Modal: { confirm: options => options.onOk() }, Spin: 'Spin', Table: 'Table' },
    './VmSnapshotCreate': 'SnapshotCreate',
    './VmSnapshots.less': {},
    dva: { connect: () => component => component }, '@/utils/intl': { formatMessage: ({ id }) => id },
    '@/utils/global': globalUtil, '../../utils/vmSnapshotRead': helpers,
    '../../utils/vmSnapshotRestore': { ...restoreHelpers, newVMRestoreRequestId: () => 'restore-07070707070707070707070707070707' },
    '../../components/VMStorageSnapshotHint': load('components/VMStorageSnapshotHint/index.js', { react: React, antd: { Alert: 'Alert', Button: 'Button' }, '@/utils/intl': { formatMessage: ({ id }) => id } }).default, './componentPolling': polling
  }, { document, window: { crypto: { getRandomValues: bytes => { bytes.fill(7); return bytes; } } },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; }, clearTimeout: id => timers.delete(id) }).VmSnapshots;
  const panel = new Component({ context: { ...scope }, pollingEnabled: true, snapshotActorId: 17, storage: restoreStorage, dispatch: action => {
    const isCapability = action.type.endsWith('/capability');
    (isCapability ? capabilityActions : actions).push(action);
    const read = execute(model.effects[action.type.split('/')[1]](action, { call: (fn, ...args) => ({ fn, args }) }));
    (isCapability ? capabilityPending : pending).push(read);
    return read;
  } });
  panel.setState = (change, callback) => { panel.state = { ...panel.state, ...change }; if (callback) callback(); };
  h.panel = panel;
  h.settle = async () => { await pending[pending.length - 1]; };
  h.settleCapability = async () => { await capabilityPending[capabilityPending.length - 1]; };
  h.mount = async () => { panel.componentDidMount(); await h.settle(); };
  h.advance = async () => {
    const [id, timer] = timers.entries().next().value;
    timers.delete(id); timer.callback(); await h.settle(); return timer.delay;
  };
  h.update = async changes => { const previous = panel.props; panel.props = { ...previous, ...changes }; panel.componentDidUpdate(previous); await h.settle(); };
  h.hide = hidden => { document.hidden = hidden; listeners.forEach(listener => listener()); };
  return h;
}

test('snapshot details render with actual Ant Design 3.19 when optional fields are missing', async () => {
  const h = harness();await h.mount();
  for (const extra of [{}, { config: { cpu_milli: 1000, memory_mib: 1024, boot_mode: 'bios' } },
    { error_code: 'vm_snapshot_native_failed' }]) {
    h.panel.setState({ detail: item('snapshot-real', extra), detailStatus: 'ready' });
    const view = h.panel.renderDetail();
    const description = view.props.children.find(child => child?.type?.Item === 'D');
    const children = description.props.children.map((child, index) => React.isValidElement(child)
      ? React.createElement(AntdDescriptions.Item, { ...child.props, key: `field-${index}` }) : child);
    let markup;
    assert.doesNotThrow(() => { markup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AntdDescriptions, { ...description.props, children })); });
    assert.match(markup, /snapshot-real/);
  }
  h.panel.componentWillUnmount();
});
function elements(element) {
  if (Array.isArray(element)) return element.flatMap(elements);
  if (!element || typeof element !== 'object') return [];
  const children = typeof element.props?.children === 'function' ? element.props.children(null, null) : element.props?.children;
  return [element, ...elements(children), ...elements(element.props?.description), ...elements(element.props?.extra)];
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

test('current VM checks retain complete Go outputs while summarizing capability diagnostics', async () => {
  const cases = require('../../utils/fixtures/vmExistingSnapshotCapability.go.json');
  for (const [name, data] of Object.entries(cases)) {
    const h = harness();
    h.capabilityRequest = async () => ok(data);
    await h.mount(); await h.settleCapability();
    assert.equal(h.panel.state.capabilityStatus, 'ready', name);
    assert.equal(h.panel.state.capability.status, data.status, name);
    assert.equal(h.panel.state.capability.complete, data.complete, name);
    assert.equal(h.panel.state.capability.volumes.length, data.volumes.length, name);
    assert.equal(h.panel.state.capability.excluded_volumes.length, data.excluded_volumes.length, name);
    assert.deepEqual(Array.from(h.panel.state.capability.volumes, row => row.read_only), data.volumes.map(row => row.read_only));
    const tables = elements(h.panel.renderCapability()).filter(node => node.type === 'Table');
    if (data.supported && data.complete) assert.equal(h.panel.renderCapability(), null, name);
    assert.equal(tables.length, 0, 'capability diagnostics do not add disk tables to the snapshot list');
    assert.equal(h.capabilityRequests[0].url, '/console/teams/team-a/apps/vm-a/vm-snapshot-capability');
    assert.deepEqual(Object.keys(h.capabilityRequests[0].options.params), ['region_name']);
    assert.equal(h.capabilityRequests[0].options.method, 'get');
    h.panel.componentWillUnmount();
  }
});

test('supported storage stays quiet during background polling and only explicit refresh rechecks capability', async () => {
  const h = harness(); await h.mount(); await h.settleCapability();
  assert.equal(h.panel.renderCapability(), null);
  assert.equal(elements(h.panel.render()).find(node => node.type === 'SnapshotCreate').props.capabilityReady, true);
  const slowList = deferred();
  h.request = () => slowList.promise;
  const polling = h.advance();
  assert.equal(h.panel.state.listRefreshing, false, 'background reads do not spin the refresh button');
  assert.equal(h.capabilityRequests.length, 1, 'list polling does not recheck storage');
  slowList.resolve(list()); await polling;
  const slowCapability = deferred();
  h.request = async () => list(); h.capabilityRequest = () => slowCapability.promise;
  await h.panel.read('list');
  assert.equal(h.capabilityRequests.length, 2, 'manual refresh still rechecks storage');
  assert.equal(h.panel.renderCapability(), null, 'previous support does not flash a checking banner');
  const create = elements(h.panel.render()).find(node => node.type === 'SnapshotCreate');
  assert.equal(create.props.capabilityChecking, true);
  assert.equal(create.props.capabilityReady, false);
  slowCapability.resolve(undefined); await h.settleCapability();
  assert.ok(h.panel.renderCapability(), 'a failed recheck still exposes the reason');
  assert.equal(elements(h.panel.render()).find(node => node.type === 'SnapshotCreate').props.capabilityReady, false);
  h.panel.componentWillUnmount();
});

test('capability refresh failure invalidates prior support, missing endpoint stays unknown and does not break record reads', async () => {
  const h = harness(); await h.mount(); await h.settleCapability();
  assert.equal(h.panel.state.capability.supported, true);
  h.capabilityRequest = async () => undefined;
  await h.panel.readCapability();
  assert.equal(h.panel.state.capabilityStatus, 'failed');
  assert.equal(h.panel.renderCapability().props.role, 'alert');
  h.capabilityRequest = async () => ({ status_code: 404, business_code: 404 });
  await h.panel.readCapability();
  assert.equal(h.panel.state.capabilityStatus, 'unknown');
  assert.equal(h.panel.state.listStatus, 'ready');
  h.capabilityRequest = async () => ok(currentCapability({ supported: true, complete: false }));
  await h.panel.readCapability();
  assert.equal(h.panel.state.capabilityStatus, 'failed');
  h.panel.componentWillUnmount();
});

test('capability has one in-flight read and a storage refresh token invalidates older responses', async () => {
  const h = harness(); const slow = deferred();
  h.capabilityRequest = () => slow.promise;
  await h.mount();
  const old = h.capabilityPending[0];
  h.panel.readCapability(); h.panel.readCapability();
  assert.equal(h.capabilityRequests.length, 1);
  h.capabilityRequest = async () => ok(currentCapability({ supported: false, status: 'unknown', complete: false,
    reason_code: 'vm_changed_during_check', message: 'Changed' }));
  await h.update({ capabilityRefreshToken: 'new-disk-set' }); await h.settleCapability();
  slow.resolve(ok(currentCapability())); await old;
  assert.equal(h.panel.state.capability.status, 'unknown');
  assert.equal(h.panel.state.capability.reason_code, 'vm_changed_during_check');
  const before = h.capabilityRequests.length;
  h.hide(true); h.panel.readCapability();
  assert.equal(h.capabilityRequests.length, before);
  h.panel.componentWillUnmount();
});

test('a late capability response cannot cross the service identity or continue after unmount', async () => {
  const h = harness(); const slow = deferred();
  h.capabilityRequest = () => slow.promise; await h.mount();
  const old = h.capabilityPending[0];
  h.scope.alias = 'vm-b'; h.scope.serviceId = 'service-b';
  h.capabilityRequest = async () => ok(currentCapability({ message: 'B current' }));
  await h.update({ context: { ...h.scope } }); await h.settleCapability();
  slow.resolve(ok(currentCapability({ message: 'Old A' }))); await old;
  assert.equal(h.panel.state.capability.message, 'B current');
  h.panel.componentWillUnmount();
  const before = h.capabilityRequests.length; h.panel.readCapability();
  assert.equal(h.capabilityRequests.length, before);
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

test('v1.1 identity pending and unknown remain visible and never become ready snapshots', async () => {
  for (const code of ['vm_snapshot_identity_pending', 'vm_snapshot_identity_outcome_unknown']) {
    const h = harness();
    const row = item('point-a', { phase: 'stopping', error_code: code });
    h.request = async url => url.endsWith('/point-a') ? ok(row) : list([row]);
    await h.mount();
    assert.equal(h.panel.state.listStatus, 'ready');
    assert.equal(h.panel.state.items[0].error_code, code);
    assert.equal(h.panel.state.items[0].ready_to_use, false);
    h.panel.select(true, h.panel.state.items[0]); await h.settle();
    assert.equal(h.panel.state.detail.error_code, code);
    h.request = async () => list([{ ...row, ready_to_use: true }]);
    await h.panel.read('list');
    assert.equal(h.panel.state.listStatus, 'failed');
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

test('native restore service and model preserve snapshot and request identity', async () => {
  const h = harness();
  const payload = { team_name: 'team-a', region_name: 'region-a', app_alias: 'vm-a',
    snapshot_name: 'point-a', request_id: 'restore-a' };
  h.request = async (url, options) => {
    assert.equal(url, '/console/teams/team-a/apps/vm-a/vm-snapshots/point-a/restore');
    assert.equal(options.method, 'post');
    assert.equal(options.data.request_id, 'restore-a');
    assert.equal(options.data.team_name, 'team-a');
    assert.equal(options.data.region_name, 'region-a');
    return { status_code: 202, business_code: 202, bean: { restore_name: 'vmr-aaaaaaaaaaaaaaaaaaaaaaaa',
      snapshot_name: 'point-a', request_id: 'restore-a', phase: 'pending', complete: false, volumes: [] } };
  };
  let result;
  await h.panel.props.dispatch({ type: 'vmSnapshotReads/startRestore', payload, shouldApply: () => true,
    callback: value => { result = value; } });
  assert.equal(result.phase, 'pending');
  h.request = async (url, options) => {
    assert.ok(url.endsWith('/vm-snapshots/point-a/restore/restore-a'));
    assert.equal(options.method, 'get');
    return { status_code: 200, business_code: 200, bean: { ...result, phase: 'succeeded', complete: true } };
  };
  await h.panel.props.dispatch({ type: 'vmSnapshotReads/restoreStatus', payload, shouldApply: () => true,
    callback: value => { result = value; } });
  assert.equal(result.complete, true);
  assert.equal(result.phase, 'succeeded');
});

test('restore attempt storage is immutable and remains bound to the actor and component', () => {
  const store = storage();
  const context = { team: 'team-a', region: 'region-a', application: '42', alias: 'vm-a', serviceId: 'service-a' };
  const key = restoreHelpers.vmRestoreAttemptKey(context, 17);
  restoreHelpers.saveVMRestoreAttempt(store, key, { snapshot_name: 'point-a', request_id: 'restore-a' });
  assert.equal(restoreHelpers.loadVMRestoreAttempt(store, key).request_id, 'restore-a');
  assert.throws(() => restoreHelpers.saveVMRestoreAttempt(store, key, { snapshot_name: 'point-a', request_id: 'restore-b' }));
  assert.notEqual(key, restoreHelpers.vmRestoreAttemptKey({ ...context, serviceId: 'service-b' }, 17));
  assert.notEqual(key, restoreHelpers.vmRestoreAttemptKey(context, 18));
  restoreHelpers.clearVMRestoreAttempt(store, key);
  assert.equal(restoreHelpers.loadVMRestoreAttempt(store, key), null);
});

test('only complete ready snapshots can restore and a restore is polled to completion', async () => {
  const h = harness();
  const ready = item('point-a', { phase: 'ready', ready_to_use: true, manifest_acked: true, finalized: true,
    coverage: { complete: true, expected_writable_disks: 1, included_disks: 1, missing_disk_keys: [], excluded_read_only: [] } });
  h.request = async (url, options) => {
    if (!url.includes('/restore')) return list([ready]);
    const base = { restore_name: 'vmr-aaaaaaaaaaaaaaaaaaaaaaaa', snapshot_name: 'point-a',
      request_id: options.method === 'post' ? options.data.request_id : url.split('/').pop(), volumes: [] };
    return options.method === 'post'
      ? { status_code: 202, business_code: 202, bean: { ...base, phase: 'pending', complete: false } }
      : { status_code: 200, business_code: 200, bean: { ...base, phase: 'succeeded', complete: true } };
  };
  await h.mount();
  assert.equal(h.panel.canRestore(ready), true);
  assert.equal(h.panel.canRestore({ ...ready, finalized: false }), false);
  h.panel.confirmRestore(ready);
  await h.settle();
  assert.equal(h.panel.state.restore.phase, 'pending');
  const restoreTimer = Array.from(h.timers.values()).find(timer => timer.delay < 10000);
  assert.ok(restoreTimer, 'pending restore has a dedicated status poll');
  restoreTimer.callback();
  await h.settle();
  assert.equal(h.panel.state.restore.phase, 'succeeded');
  assert.equal(h.panel.state.restore.complete, true);
  h.panel.componentWillUnmount();
});

test('an uncertain restore submission keeps its durable request and reads status instead of reposting', async () => {
  const h = harness();
  const ready = item('point-a', { phase: 'ready', ready_to_use: true, manifest_acked: true, finalized: true,
    coverage: { complete: true, expected_writable_disks: 1, included_disks: 1, missing_disk_keys: [], excluded_read_only: [] } });
  let posts = 0;
  h.request = async (url, options) => {
    if (!url.includes('/restore')) return list([ready]);
    if (options.method === 'post') {
      posts += 1;
      options.handleError({ response: { status: 503, data: { data: { bean: { error: {
        code: 'vm_restore_outcome_unknown', retryable: true } } } } } });
      return undefined;
    }
    const requestId = url.split('/').pop();
    return { status_code: 200, business_code: 200, bean: { restore_name: 'vmr-aaaaaaaaaaaaaaaaaaaaaaaa',
      snapshot_name: 'point-a', request_id: requestId, phase: 'succeeded', complete: true, volumes: [] } };
  };
  await h.mount();
  h.panel.confirmRestore(ready); await h.settle();
  assert.equal(h.panel.state.restoreStatus, 'pending');
  assert.equal(h.restoreStorage.map.size, 1);
  const restoreTimer = Array.from(h.timers.values()).find(timer => timer.delay < 10000);
  restoreTimer.callback(); await h.settle();
  assert.equal(h.panel.state.restoreStatus, 'succeeded');
  assert.equal(posts, 1);
  assert.equal(h.restoreStorage.map.size, 0);
  h.panel.componentWillUnmount();
});

function readySnapshot() {
  return item('point-a', { phase: 'ready', ready_to_use: true, manifest_acked: true, finalized: true,
    coverage: { complete: true, expected_writable_disks: 1, included_disks: 1, missing_disk_keys: [], excluded_read_only: [] } });
}
function restoreResponse(options, url, extra = {}) {
  const status = options.method === 'post' ? 202 : 200;
  return { status_code: status, business_code: status, bean: { restore_name: 'vmr-aaaaaaaaaaaaaaaaaaaaaaaa',
    snapshot_name: 'point-a', request_id: options.method === 'post' ? options.data.request_id : url.split('/').pop(),
    phase: 'pending', complete: false, volumes: [], ...extra } };
}
async function tickRestore(h) {
  const id = h.panel.timers.restore;
  const timer = h.timers.get(id);
  assert.ok(timer, 'restore has a separate scheduled request');
  h.timers.delete(id); timer.callback(); await h.settle();
}

test('native restore advance is optional, boolean and restricted to pending results', () => {
  const input = { snapshot_name: 'point-a', request_id: 'restore-a' };
  const response = ok({ restore_name: 'vmr-aaaaaaaaaaaaaaaaaaaaaaaa', ...input, phase: 'pending', complete: false, volumes: [] });
  assert.equal(Object.hasOwn(restoreHelpers.readVMRestore(response, input, false), 'requires_advance'), false);
  for (const requires_advance of [false, true]) {
    assert.equal(restoreHelpers.readVMRestore({ ...response, bean: { ...response.bean, requires_advance } }, input, false).requires_advance,
      requires_advance);
  }
  for (const phase of ['succeeded', 'failed']) {
    const bean = { ...response.bean, phase, complete: phase === 'succeeded', requires_advance: false };
    assert.equal(restoreHelpers.readVMRestore({ ...response, bean }, input, false).phase, phase);
  }
  for (const extra of [{ requires_advance: 1 }, { requires_advance: 'true' }, { requires_advance: null },
    { requires_advance: true, phase: 'succeeded', complete: true }, { requires_advance: true, phase: 'failed' }]) {
    assert.throws(() => restoreHelpers.readVMRestore({ ...response, bean: { ...response.bean, ...extra } }, input, false));
  }
});

test('only a GET pending advance result authorizes the next POST with the same durable request', async () => {
  const h = harness(); const ready = readySnapshot(); const methods = [];
  h.request = async (url, options) => {
    if (!url.includes('/restore')) return list([ready]);
    methods.push(options.method);
    assert.equal(options.method === 'post' ? options.data.request_id : url.split('/').pop(), 'restore-07070707070707070707070707070707');
    return restoreResponse(options, url, methods.length === 4
      ? { phase: 'succeeded', complete: true, requires_advance: false } : { requires_advance: true });
  };
  await h.mount(); h.panel.confirmRestore(ready); await h.settle();
  assert.equal(h.panel.state.restoreAdvanceReady, false, 'POST response alone cannot authorize another POST');
  await tickRestore(h);
  assert.equal(h.panel.state.restoreAdvanceReady, true);
  await tickRestore(h);
  assert.equal(h.panel.state.restoreAdvanceReady, false);
  await tickRestore(h);
  assert.deepEqual(methods, ['post', 'get', 'post', 'get']);
  assert.equal(h.panel.state.restoreStatus, 'succeeded');
  assert.equal(h.restoreStorage.map.size, 0);
  h.panel.componentWillUnmount();
});

test('uncertain advance cannot overlap another request and must GET before any further POST', async () => {
  const h = harness(); const ready = readySnapshot(); const methods = []; const slow = deferred();
  h.request = async (url, options) => {
    if (!url.includes('/restore')) return list([ready]);
    methods.push(options.method);
    if (methods.length === 3) {
      await slow.promise;
      options.handleError({ response: { status: 503, data: { data: { bean: { error: {
        code: 'vm_restore_outcome_unknown', retryable: true } } } } } });
      return undefined;
    }
    return restoreResponse(options, url, methods.length === 6
      ? { phase: 'succeeded', complete: true } : { requires_advance: true });
  };
  await h.mount(); h.panel.confirmRestore(ready); await h.settle(); await tickRestore(h);
  const timerId = h.panel.timers.restore; const timer = h.timers.get(timerId);
  h.timers.delete(timerId); timer.callback();
  h.panel.requestRestore(false); h.panel.requestRestore(true);
  assert.deepEqual(methods, ['post', 'get', 'post'], 'one restore read or write is allowed in flight');
  slow.resolve(); await h.settle();
  assert.equal(h.panel.state.restoreAdvanceReady, false);
  assert.equal(h.restoreStorage.map.size, 1);
  await tickRestore(h); await tickRestore(h); await tickRestore(h);
  assert.deepEqual(methods, ['post', 'get', 'post', 'get', 'post', 'get']);
  assert.equal(h.panel.state.restoreStatus, 'succeeded');
  h.panel.componentWillUnmount();
});

test('late advance authorization is isolated after unmount and re-entry GETs the saved request first', async () => {
  const h = harness(); const ready = readySnapshot(); const slow = deferred();
  h.request = async (url, options) => {
    if (!url.includes('/restore')) return list([ready]);
    if (options.method === 'get') await slow.promise;
    return restoreResponse(options, url, { requires_advance: true });
  };
  await h.mount(); h.panel.confirmRestore(ready); await h.settle();
  const timer = h.timers.get(h.panel.timers.restore); timer.callback();
  h.panel.componentWillUnmount(); slow.resolve(); await h.settle();
  assert.equal(h.panel.state.restoreAdvanceReady, false);
  assert.equal(h.requests.filter(value => value.options.method === 'post').length, 1);
  const next = harness(h.restoreStorage); const methods = [];
  next.request = async (url, options) => {
    if (!url.includes('/restore')) return list([ready]);
    methods.push(options.method);
    assert.equal(options.method === 'post' ? options.data.request_id : url.split('/').pop(),
      'restore-07070707070707070707070707070707');
    return restoreResponse(options, url, methods.length === 2
      ? { phase: 'succeeded', complete: true } : { requires_advance: true });
  };
  await next.mount(); assert.deepEqual(methods, ['get']);
  await tickRestore(next); assert.deepEqual(methods, ['get', 'post']);
  assert.equal(next.panel.state.restoreStatus, 'succeeded');
  next.panel.componentWillUnmount();
});

test('a late GET from another component cannot authorize a restore POST in the current component', async () => {
  const h = harness(); const ready = readySnapshot(); const slow = deferred();
  h.request = async (url, options) => {
    if (!url.includes('/restore')) return list([ready]);
    if (options.method === 'get') await slow.promise;
    return restoreResponse(options, url, { requires_advance: true });
  };
  await h.mount(); h.panel.confirmRestore(ready); await h.settle();
  h.timers.get(h.panel.timers.restore).callback();
  const oldRead = h.pending[h.pending.length - 1];
  h.scope.alias = 'vm-b'; h.scope.serviceId = 'service-b';
  await h.update({ context: { ...h.scope } });
  slow.resolve(); await oldRead;
  assert.equal(h.panel.state.restoreStatus, 'idle');
  assert.equal(h.panel.state.restoreAdvanceReady, false);
  h.panel.requestRestore(false);
  assert.equal(h.requests.filter(value => value.options.method === 'post').length, 1);
  h.panel.componentWillUnmount();
});

test('capability errors use compact messages, keep creation closed, and can be refreshed', async () => {
  const h = harness(); await h.mount();
  for (const [status, code, expected] of [[403, 'vm_snapshot_forbidden', 'failed'], [404, 'vm_snapshot_not_found', 'unknown'],
    [422, 'vm_snapshot_incomplete', 'unsupported'], [503, 'vm_snapshot_dependency_unavailable', 'failed']]) {
    h.capabilityRequest = async () => ({ status_code: status, business_code: status, bean: { error: { code, retryable: status === 503 } } });
    await h.panel.readCapability();
    assert.equal(h.panel.state.capabilityStatus, expected);
    const view = h.panel.renderCapability(); const serialized = JSON.stringify(view);
    assert.equal(serialized.includes(code), false, 'internal error codes are not displayed');
    assert.ok(serialized.includes(status === 403 ? 'error.forbidden' : 'component.checkUnavailable'));
    assert.equal(elements(h.panel.render()).find(value => value.type === 'SnapshotCreate').props.capabilityReady, false);
    assert.equal(h.panel.state.listStatus, 'ready');
    const requests = h.requests.length; const count = h.capabilityRequests.length;
    await h.panel.read('list');
    assert.equal(h.capabilityRequests.length, count + 1); assert.equal(h.requests.length, requests + 1);
  }
  h.panel.componentWillUnmount();
});

test('busy operations show one notice while excluded media and internal reason codes stay hidden', async () => {
  const h = harness();
  const value = currentCapability({ status: 'unknown', supported: false, reason_code: 'component_operation_in_progress', message: '',
    excluded_volumes: [{ key: 'virtio', role: 'media', reason_code: 'read_only_installation_media' }] });
  value.volumes[0].message = ''; value.volumes[0].reason_code = 'future_ready';
  h.capabilityRequest = async () => ok(value); await h.mount(); await h.settleCapability();
  const view = h.panel.renderCapability();
  const rendered = JSON.stringify(view);
  assert.ok(rendered.includes('component.busy'));
  for (const hidden of ['component_operation_in_progress', 'future_ready', 'read_only_installation_media', 'virtio', 'restorePlanIndependent']) {
    assert.equal(rendered.includes(hidden), false, hidden);
  }
  const tables = elements(view).filter(node => node.type === 'Table');
  assert.equal(tables.length, 0);
  assert.equal(h.panel.state.capability.excluded_volumes[0].key, 'virtio');
  assert.equal(elements(h.panel.render()).find(node => node.type === 'SnapshotCreate').props.capabilityReady, false);
  h.panel.componentWillUnmount();
});

test('restore configuration changes retain the safe 422 code and never retry automatically', async () => {
  const code = 'vm_restore_native_configuration_changed';
  const error = { response: { status: 422, data: { data: { bean: { error: { code, retryable: false } } },
    msg: 'PRIVATE_RESTORE_CONFIGURATION_SENTINEL' } } };
  assert.deepEqual(restoreHelpers.vmRestoreError(error), { kind: 'unsupported', status: 422, code, retryable: false });
  assert.throws(() => restoreHelpers.readVMRestore(ok({ restore_name: 'vmr-aaaaaaaaaaaaaaaaaaaaaaaa',
    snapshot_name: 'point-a', request_id: 'restore-a', phase: 'failed', complete: false, volumes: [], error_code: code }),
  { snapshot_name: 'point-a', request_id: 'restore-a' }, false), 'HTTP admission code is not a native restore DTO error');
  const h = harness(); const ready = readySnapshot();
  h.request = async (url, options) => {
    if (!url.includes('/restore')) return list([ready]);
    options.handleError(error);
    return undefined;
  };
  await h.mount(); h.panel.confirmRestore(ready); await h.settle();
  assert.equal(h.panel.state.restoreStatus, 'failed');
  assert.equal(h.panel.state.restoreError.code, code);
  assert.ok(ReactDOMServer.renderToStaticMarkup(h.panel.renderRestoreStatus().props.message).includes(`errorCode.${code}`));
  assert.equal(h.panel.timers.restore, null);
  assert.equal(h.requests.filter(value => value.url.includes('/restore')).length, 1);
  assert.equal(JSON.stringify(h.panel.renderRestoreStatus()).includes('PRIVATE_RESTORE_CONFIGURATION_SENTINEL'), false);
  h.panel.componentWillUnmount();
});
