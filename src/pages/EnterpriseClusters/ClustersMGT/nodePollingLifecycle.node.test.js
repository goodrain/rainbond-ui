const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const pollingHelpers = require('../../Component/componentPolling');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
const page = ast.program.body.find(node => node.type === 'ClassDeclaration');
const methods = page.body.body.filter(node => node.key.name !== 'render').map(node => source.slice(node.start, node.end)).join('\n');

function harness() {
  const requests = [];
  const timers = new Map();
  const listeners = new Map();
  const errors = [];
  let serial = 0;
  class Component {
    constructor(props) { this.props = props; }
    setState(update, callback) { this.state = { ...this.state, ...update }; if (callback) callback(); }
  }
  const document = {
    hidden: false,
    addEventListener: (event, callback) => listeners.set(event, callback),
    removeEventListener: event => listeners.delete(event)
  };
  const dependencies = {
    Component, document, ...pollingHelpers,
    pluginUtils: { isInstallPlugin: () => false },
    normalizeNodeDiskUsage: () => [],
    notification: { error: error => errors.push(error), success: () => {} },
    formatMessage: value => value.id,
    setTimeout: (callback, delay) => { const id = ++serial; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id)
  };
  const Page = new Function(...Object.keys(dependencies), `return class extends Component { ${methods} };`)(...Object.values(dependencies));
  const instance = new Page({ pluginsList: [], match: { params: { eid: 'enterprise-a', regionID: 'region-id-a' } }, dispatch: action => requests.push(action) });
  instance.componentDidMount();
  return {
    page: instance, document, requests, timers, errors, listeners,
    matching(type) { return requests.filter(action => action.type === `region/${type}`); },
    visible(visible) { document.hidden = !visible; listeners.get('visibilitychange')(); },
    fire(delay) {
      const entry = [...timers].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `expected ${delay}ms retry/refresh`);
      timers.delete(entry[0]); entry[1].callback();
    },
    updateScope(regionID, eid = 'enterprise-a') {
      const previous = instance.props;
      instance.props = { ...previous, match: { params: { eid, regionID } } };
      instance.componentDidUpdate(previous);
    }
  };
}
const regionA = { region_id: 'region-id-a', region_name: 'region-a', provider: 'rke' };
const nodes = { status_code: 200, list: [{ name: 'node-a' }], bean: {} };
function ready(h, region = regionA) {
  h.matching('fetchEnterpriseClusters').slice(-1)[0].callback({ list: [region] });
}

{
  const h = harness(); ready(h);
  h.matching('fetClusterNodeList')[0].callback(nodes);
  h.page.fetClusterNodeList(regionA);
  h.matching('fetClusterNodeList')[1].callback(nodes);
  assert.strictEqual(h.timers.size, 1, 'manual refresh must replace the pending periodic chain');
  h.visible(false);
  assert.strictEqual(h.timers.size, 0, 'hidden node page must stop scheduled reads');
  assert.strictEqual(h.matching('fetchClusterInfoList').length, 0, 'discarded cluster_node reads must be removed');
}

{
  const h = harness(); ready(h);
  h.matching('fetchClusterInfo')[0].callback({ status_code: 200, bean: { event_id: 'event-a' } });
  h.matching('fetClusterNodeList')[0].callback(nodes);
  const before = h.requests.length;
  h.fire(5000);
  assert.strictEqual(h.requests.length - before, 2, 'one RKE cycle reads only nodes and the required eventId (was three)');
  assert.strictEqual(h.matching('fetchClusterInfoList').length, 0);
  assert.strictEqual(h.matching('fetchClusterInfo').length, 2);
  assert.strictEqual(h.matching('fetClusterNodeList').length, 2);
}
{
  const h = harness(); ready(h);
  const oldNodes = h.matching('fetClusterNodeList')[0];
  const oldEvent = h.matching('fetchClusterInfo')[0];
  const oldDashboard = h.matching('fetDashboardList')[0];
  h.visible(false);
  const before = h.requests.length;
  oldNodes.callback(nodes); oldNodes.handleError({});
  oldEvent.callback({ status_code: 200, bean: { event_id: 'hidden-event' } }); oldEvent.handleError({});
  oldDashboard.callback({ list: ['hidden-dashboard'] }); oldDashboard.handleError({});
  h.page.fetClusterNodeList(regionA);
  h.page.loadClusters();
  assert.strictEqual(h.requests.length, before, 'hidden node page must make zero new requests');
  assert.strictEqual(h.timers.size, 0);
  assert.strictEqual(h.errors.length, 0);
  assert.deepStrictEqual(h.page.state.nodeList, []);
  assert.strictEqual(h.page.state.eventId, '');
  h.visible(true);
  assert.strictEqual(h.matching('fetClusterNodeList').length, 2, 'restore must not wait for an obsolete flight');
  assert.strictEqual(h.matching('fetchClusterInfo').length, 2, 'the auxiliary flow must also recover');
  h.matching('fetClusterNodeList')[1].callback(nodes);
  assert.strictEqual(h.timers.size, 1);
}
for (const change of ['scope', 'enterprise', 'unmount']) {
  const h = harness(); ready(h);
  const old = h.requests.slice(1);
  const previousState = h.page.state;
  if (change === 'unmount') h.page.componentWillUnmount();
  else {
    h.updateScope('region-id-b', change === 'enterprise' ? 'enterprise-b' : 'enterprise-a');
    const regionB = { ...regionA, region_id: 'region-id-b', region_name: 'region-b' };
    ready(h, regionB);
    h.matching('fetClusterNodeList').slice(-1)[0].callback({ ...nodes, list: [{ name: 'node-b' }] });
    h.matching('fetchClusterInfo').slice(-1)[0].callback({ status_code: 200, bean: { event_id: 'event-b' } });
  }
  const currentState = h.page.state;
  const timerCount = h.timers.size;
  old.forEach(action => {
    if (action.type.endsWith('fetClusterNodeList')) action.callback(nodes);
    else if (action.type.endsWith('fetchClusterInfo')) action.callback({ status_code: 200, bean: { event_id: 'old-event' } });
    else action.callback({ list: ['old-dashboard'] });
    if (action.handleError) action.handleError({});
  });
  assert.deepStrictEqual(h.page.state, currentState, `${change} must reject all stale response writes`);
  assert.strictEqual(h.timers.size, timerCount);
  assert.strictEqual(h.errors.length, 0);
  if (change === 'unmount') {
    assert.deepStrictEqual(h.page.state, previousState);
    assert.strictEqual(h.timers.size, 0);
    assert.strictEqual(h.listeners.size, 0);
  }
}
{
  const h = harness(); ready(h);
  h.page.fetClusterNodeList(regionA);
  h.page.fetClusterNodeList(regionA);
  assert.strictEqual(h.matching('fetClusterNodeList').length, 1, 'manual refreshes wait for the current flight');
  h.matching('fetClusterNodeList')[0].callback(nodes);
  assert.strictEqual(h.matching('fetClusterNodeList').length, 2, 'coalesced action must trigger one fresh read after the old flight');
  assert.deepStrictEqual(h.page.state.nodeList, [], 'response preceding the manual operation must not be applied');
  h.matching('fetClusterNodeList')[1].callback(nodes);
  assert.strictEqual(h.timers.size, 1);
  h.fire(5000);
  h.matching('fetClusterNodeList')[2].handleError({});
  h.fire(10000);
  h.matching('fetClusterNodeList')[3].handleError({});
  h.fire(20000);
  h.matching('fetClusterNodeList')[4].callback(nodes);
  h.fire(5000);
  h.matching('fetClusterNodeList')[5].handleError({});
  assert.ok([...h.timers.values()].some(timer => timer.delay === 10000), 'success resets backoff; failure never permanently stops polling');
}
{
  const h = harness();
  const oldMetadata = h.matching('fetchEnterpriseClusters')[0];
  h.visible(false); h.visible(true);
  assert.strictEqual(h.matching('fetchEnterpriseClusters').length, 2);
  oldMetadata.callback({ list: [regionA] });
  assert.strictEqual(h.matching('fetClusterNodeList').length, 0, 'metadata from a hidden generation must not fan out');
  ready(h);
  assert.strictEqual(h.matching('fetClusterNodeList').length, 1);
  h.page.componentWillUnmount();
  h.matching('fetClusterNodeList')[0].handleError({});
  assert.strictEqual(h.timers.size, 0);
}

const modelSource = fs.readFileSync(path.join(__dirname, '../../../models/region.js'), 'utf8');
const modelAst = parser.parse(modelSource, { sourceType: 'module' });
const model = modelAst.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
const effect = model.properties.find(node => node.key.name === 'effects').value.properties.find(node => node.key.name === 'fetchClusterInfo');
const fetchInfo = new Function('fetchClusterInfo', `return ({ ${modelSource.slice(effect.start, effect.end)} }).fetchClusterInfo;`)(() => {});
function startEffect(action) {
  const generator = fetchInfo(action, { call: (fn, payload) => ({ call: payload }), put: update => ({ put: update }) });
  assert.deepStrictEqual(generator.next().value, { call: action.payload });
  return generator;
}
for (const change of ['scope', 'hidden', 'unmount']) {
  const h = harness(); ready(h);
  const generator = startEffect(h.matching('fetchClusterInfo')[0]);
  if (change === 'scope') h.updateScope('region-id-b');
  if (change === 'hidden') h.visible(false);
  if (change === 'unmount') h.page.componentWillUnmount();
  assert.strictEqual(generator.next({ bean: { event_id: 'old' } }).done, true, `${change} must skip the auxiliary store write and callback`);
}
for (const guarded of [true, false]) {
  let active = true;
  let callbacks = 0;
  const action = { payload: {}, callback: () => { callbacks += 1; } };
  if (guarded) action.shouldApply = () => active;
  const generator = startEffect(action);
  assert.deepStrictEqual(generator.next({ bean: {} }).value, { put: { type: 'saveClusterInfoAddCluster', payload: {} } });
  active = false;
  assert.strictEqual(generator.next().done, true);
  assert.strictEqual(callbacks, guarded ? 0 : 1, 'default callers remain compatible; lifecycle is rechecked after put');
}

const metadataMethod = model.properties.find(node => node.key.name === 'effects').value.properties.find(node => node.key.name === 'fetchEnterpriseClusters');
const fetchMetadata = new Function('fetchEnterpriseClusters', `return ({ ${modelSource.slice(metadataMethod.start, metadataMethod.end)} }).fetchEnterpriseClusters;`)(() => {});
function startMetadataEffect(action) {
  const generator = fetchMetadata(action, { call: (fn, payload) => ({ call: payload }), put: update => ({ put: update }) });
  assert.deepStrictEqual(generator.next().value, { call: action.payload });
  return generator;
}
for (const change of ['scope', 'hidden', 'unmount']) {
  const h = harness();
  const generator = startMetadataEffect(h.matching('fetchEnterpriseClusters')[0]);
  if (change === 'scope') h.updateScope('region-id-b', 'enterprise-b');
  if (change === 'hidden') h.visible(false);
  if (change === 'unmount') h.page.componentWillUnmount();
  assert.strictEqual(generator.next({ list: [regionA] }).done, true,
    `${change} must reject enterprise metadata before saveClusterInfo and callback`);
  assert.strictEqual(h.matching('fetClusterNodeList').length, 0);
}
for (const guarded of [true, false]) {
  let active = true;
  let callbacks = 0;
  const action = { payload: {}, callback: () => { callbacks += 1; } };
  if (guarded) action.shouldApply = () => active;
  const generator = startMetadataEffect(action);
  assert.deepStrictEqual(generator.next({ list: [regionA] }).value,
    { put: { type: 'saveClusterInfo', payload: [regionA] } });
  active = false;
  assert.strictEqual(generator.next().done, true);
  assert.strictEqual(callbacks, guarded ? 0 : 1,
    'enterprise metadata must recheck lifecycle after put and retain default caller behavior');
}

console.log('cluster node polling lifecycle tests passed');
