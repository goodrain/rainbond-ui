const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  getComponentPollingDelay,
  ACTIVE_POLL_DELAY,
  STABLE_POLL_DELAY,
  MAX_FAILURE_POLL_DELAY
} = require('./componentPolling');

assert.strictEqual(ACTIVE_POLL_DELAY, 5000);
assert.strictEqual(STABLE_POLL_DELAY, 15000);
assert.strictEqual(MAX_FAILURE_POLL_DELAY, 60000);
assert.strictEqual(
  getComponentPollingDelay(),
  ACTIVE_POLL_DELAY,
  'polling should stay responsive until the first component status is known'
);

['starting', 'restoring', 'waiting', 'checking', 'stoping', 'stopping', 'upgrade', 'creating'].forEach(status => {
  assert.strictEqual(
    getComponentPollingDelay({ status }),
    ACTIVE_POLL_DELAY,
    `${status} should keep fast polling while state is changing`
  );
});

['running', 'closed', 'unusual', 'some_abnormal', 'undeploy', 'paused'].forEach(status => {
  assert.strictEqual(
    getComponentPollingDelay({ status }),
    STABLE_POLL_DELAY,
    `${status} should reduce polling after state stabilizes`
  );
});

assert.deepStrictEqual(
  [1, 2, 3, 4, 5].map(failureCount => getComponentPollingDelay({ failureCount })),
  [10000, 20000, 40000, 60000, 60000],
  'failures should exponentially back off with a one minute cap'
);

const componentDir = __dirname;
const mainSource = fs.readFileSync(path.join(componentDir, 'index.js'), 'utf8');
const overviewSource = fs.readFileSync(path.join(componentDir, 'overview.js'), 'utf8');
const databaseOverviewSource = fs.readFileSync(path.join(componentDir, 'databaseOverview.js'), 'utf8');
const serviceSource = fs.readFileSync(path.join(componentDir, '../../services/app.js'), 'utf8');

assert.match(mainSource, /addEventListener\(['"]visibilitychange['"],\s*this\.handleVisibilityChange\)/);
assert.match(mainSource, /removeEventListener\(['"]visibilitychange['"],\s*this\.handleVisibilityChange\)/);
assert.match(mainSource, /pollingEnabled=\{pollingEnabled\}/);
assert.match(mainSource, /getComponentPollingDelay\(\{/);
assert.match(overviewSource, /getComponentPollingDelay\(\{/);
assert.match(databaseOverviewSource, /getComponentPollingDelay\(\{/);

function exportedFunctionSource(name) {
  const pattern = new RegExp(`export (?:async )?function ${name}\\b`);
  const startMatch = pattern.exec(serviceSource);
  assert.ok(startMatch, `${name} should exist`);
  const remaining = serviceSource.slice(startMatch.index + startMatch[0].length);
  const nextExport = remaining.search(/\nexport (?:async )?function /);
  return serviceSource.slice(
    startMatch.index,
    nextExport === -1 ? serviceSource.length : startMatch.index + startMatch[0].length + nextExport
  );
}

assert.match(exportedFunctionSource('getComponentState'), /timeout:\s*10000/);
assert.match(exportedFunctionSource('getPods'), /timeout:\s*12000/);
assert.match(exportedFunctionSource('fetchOperationLog'), /timeout:\s*12000/);

console.log('component polling performance tests passed');

// Execute the production class methods, with React's state updates and requests
// controlled by the harness. Source-presence checks cannot prove lifecycle safety.
const parser = require('@babel/parser');
const pollingHelpers = require('./componentPolling');
const lifecycleMethods = new Set([
  'constructor', 'componentDidMount', 'componentDidUpdate',
  'componentWillReceiveProps', 'componentWillUnmount', 'getStatus',
  'handleTimers', 'closeTimer', 'resetStatusPolling', 'handleVisibilityChange',
  'closeComponentTimer', 'openComponentTimer', 'getPollingIdentity',
  'resetPolling', 'syncPolling', 'fetchPods', 'fetchOperationLog', 'load', 'getKubeBlocksStatus'
]);

function productionClass(filename, className, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
  const declarations = ast.program.body.map(node => node.declaration || node);
  const page = declarations.find(node => node.type === 'ClassDeclaration' && node.id.name === className);
  assert.ok(page, filename);
  const members = page.body.body.filter(node => node.key && lifecycleMethods.has(node.key.name));
  const methods = members.map(node => source.slice(node.start, node.end)).join('\n');
  return new Function(...Object.keys(dependencies), `return class extends PureComponent { ${methods} };`)(...Object.values(dependencies));
}

function harness(filename, className, parent = false) {
  const context = { team: 'team-a', region: 'region-a', alias: 'component-a' };
  const requests = [];
  const timers = new Map();
  const listeners = new Map();
  const errors = [];
  let serial = 0;
  const document = {
    hidden: false,
    addEventListener: (event, callback) => listeners.set(event, callback),
    removeEventListener: event => listeners.delete(event)
  };
  class PureComponent {
    constructor(props) { this.props = props; }
    setState(update, callback) {
      this.state = { ...this.state, ...update };
      if (callback) callback();
    }
  }
  const Page = productionClass(filename, className, {
    PureComponent, document, ...pollingHelpers,
    globalUtil: {
      getCurrTeamName: () => context.team,
      getCurrRegionName: () => context.region,
      getSlidePanelComponentID: () => context.alias
    },
    setTimeout: (callback, delay) => { const id = ++serial; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id)
  });
  const page = new Page({ appAlias: context.alias, timers: true, dispatch: action => requests.push(action) });
  page.fetchParameter = () => ({ team_name: context.team, app_alias: context.alias });
  page.handleError = error => errors.push(error);
  for (const method of ['loadBuildSourceInfo', 'getVersionList', 'fetchAppDiskAndMemory',
    'refreshVMProfileForVNC', 'loadStorageUsageIfNeeded', 'getStorageUsed', 'extractKBResourceData']) page[method] = () => {};
  if (parent) page.loadDetail = () => page.getStatus(true);
  page.componentDidMount();
  const pollRequests = () => requests.filter(action => /fetchComponentState|fetchPods|fetchOperationLog|getClusterDetail/.test(action.type));
  return {
    page, context, document, timers, listeners, errors,
    get requests() { return pollRequests(); },
    visible(visible) { document.hidden = !visible; listeners.get('visibilitychange')(); },
    update(props) {
      const prev = page.props;
      const next = { ...prev, ...props };
      if (page.componentWillReceiveProps) page.componentWillReceiveProps(next);
      page.props = next;
      if (page.componentDidUpdate) page.componentDidUpdate(prev);
    },
    fire(delay) {
      const entry = [...timers].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `${filename} should schedule ${delay}ms`);
      timers.delete(entry[0]);
      entry[1].callback();
    }
  };
}

const running = { status_code: 200, bean: { status: 'running' } };
const pods = { status_code: 200, list: { new_pods: [], old_pods: [] } };
const events = { status_code: 200, list: [] };
const drawer = '../../components/SlidePanel/components/components.js';

for (const filename of [drawer, 'index.js']) {
  const h = harness(filename, 'Main', true);
  h.requests[0].callback(running);
  assert.ok([...h.timers.values()].some(timer => timer.delay === 15000), 'real parent must reduce stable status polling');
  h.fire(15000);
  h.page.getStatus(false);
  assert.strictEqual(h.requests.length, 2, 'manual refresh must not overlap an in-flight status request');
  h.requests[1].callback({ status_code: 200, bean: { status: 'starting' } });
  h.fire(5000);
  h.requests[2].callback({ status_code: 200, bean: { status: 'unKnow' } });
  h.fire(10000);
  h.requests[3].handleError({ status: 503 });
  h.fire(20000);
  h.requests[4].handleError({ status: 503 });
  h.fire(40000);
  h.requests[5].handleError({ status: 503 });
  h.fire(60000);
  h.requests[6].callback(running);
  h.page.getStatus(false);
  assert.strictEqual(h.requests.length, 8);
  h.requests[7].callback(running);
  assert.strictEqual(h.timers.size, 1, 'manual status refresh must preserve exactly one periodic chain');
  h.fire(15000);
  const stale = h.requests[8];
  h.visible(false);
  assert.strictEqual(h.timers.size, 0);
  h.visible(true);
  assert.strictEqual(h.requests.length, 10, 'restoring visibility starts a fresh generation even with an old request pending');
  const current = h.requests[9];
  current.callback(running);
  stale.callback({ status_code: 200, bean: { status: 'closed' } });
  stale.handleError({ status: 503 });
  assert.strictEqual(h.page.state.status.status, 'running');
  assert.strictEqual(h.timers.size, 1);
  assert.strictEqual(h.errors.length, 3);
  h.page.componentWillUnmount();
  current.handleError({ status: 503 });
  assert.strictEqual(h.timers.size, 0);
  assert.strictEqual(h.listeners.size, 0);
}

for (const filename of ['overview.js', 'databaseOverview.js']) {
  const h = harness(filename, 'Index');
  const [oldPods, oldEvents] = h.requests;
  h.page.load();
  assert.strictEqual(h.requests.length, 2, 'reloading must not overlap either request flow');
  h.update({ timers: false });
  oldPods.callback(pods);
  oldEvents.handleError({ status: 503 });
  assert.strictEqual(h.timers.size, 0, 'paused callbacks must not restart polling');
  assert.strictEqual(h.page.state.new_pods, null, 'paused response must not update state');
  assert.strictEqual(h.errors.length, 0);
  h.update({ timers: true, status: { status: 'running' } });
  assert.strictEqual(h.requests.length, 4);
  h.requests[2].callback(pods);
  h.requests[3].callback(events);
  assert.strictEqual(h.timers.size, 2, 'one timer per flow after resume');
  assert.ok([...h.timers.values()].every(timer => timer.delay === 15000));
  h.update({ appAlias: 'component-b' });
  const currentPods = { status_code: 200, list: { new_pods: ['component-b'], old_pods: [] } };
  const currentEvents = { status_code: 200, list: ['component-b'] };
  h.requests[4].callback(currentPods);
  h.requests[5].callback(currentEvents);
  h.requests[2].callback(pods);
  h.requests[3].handleError({ status: 503 });
  assert.deepStrictEqual(h.page.state.new_pods, ['component-b'], 'mounted component must reject old alias responses');
  assert.deepStrictEqual(h.page.state.logList, ['component-b']);
  assert.strictEqual(h.errors.length, 0);
  assert.strictEqual(h.timers.size, 2);
  const before = h.requests.length;
  h.page.componentWillUnmount();
  for (const request of h.requests) {
    request.callback(request.type.endsWith('fetchPods') ? pods : events);
    request.handleError({ status: 503 });
  }
  h.page.load();
  assert.strictEqual(h.requests.length, before, 'unmounted component cannot dispatch');
  assert.strictEqual(h.timers.size, 0);
  assert.strictEqual(h.errors.length, 0);
  assert.strictEqual(oldPods.shouldApply(), false, 'stale alias cannot update shared pods');
}

for (const filename of [drawer, 'index.js']) {
  const h = harness(filename, 'Main', true);
  const stale = h.requests[0];
  h.page.closeComponentTimer();
  h.visible(false);
  h.visible(true);
  h.page.getStatus(false);
  stale.callback(running);
  stale.handleError({ status: 503 });
  assert.strictEqual(h.requests.length, 1, 'returning to the tab must respect business-dialog pause');
  assert.strictEqual(h.timers.size, 0);
  assert.strictEqual(h.errors.length, 0);
  h.page.openComponentTimer();
  assert.strictEqual(h.requests.length, 2);
  h.context.alias = 'component-b';
  h.update({});
  assert.strictEqual(h.requests.length, 3, 'identity change must start a fresh generation');
  h.requests[2].callback(running);
  h.requests[1].callback({ status_code: 200, bean: { status: 'closed' } });
  h.requests[1].handleError({ status: 503 });
  assert.strictEqual(h.page.state.status.status, 'running');
  assert.strictEqual(h.timers.size, 1);
  assert.strictEqual(h.errors.length, 0);
}

for (const filename of ['overview.js', 'databaseOverview.js']) {
  const h = harness(filename, 'Index');
  let request = h.requests[0];
  for (const delay of [10000, 20000, 40000, 60000, 60000]) {
    request.handleError({ status: 503 });
    h.fire(delay);
    request = h.requests[h.requests.length - 1];
  }
  request.callback(pods);
  h.fire(5000);
  h.requests[h.requests.length - 1].handleError({ status: 503 });
  assert.ok([...h.timers.values()].some(timer => timer.delay === 10000), 'success resets the flow failure count');
  h.page.componentWillUnmount();

  const manual = harness(filename, 'Index');
  manual.page.state.page_size = 12;
  manual.page.fetchOperationLog(false, true);
  manual.page.fetchOperationLog(false, true);
  assert.strictEqual(manual.requests.length, 2, 'manual event refreshes coalesce while a request is pending');
  manual.requests[1].callback({ status_code: 200, list: ['outdated page'] });
  assert.strictEqual(manual.requests.length, 3);
  assert.strictEqual(manual.requests[2].payload.page_size, 12);
  assert.deepStrictEqual(manual.page.state.logList, [], 'queued manual refresh must not apply the old page');
  manual.requests[2].callback(events);
  manual.requests[0].callback(pods);
  assert.strictEqual(manual.timers.size, 2, 'manual refresh preserves one event chain alongside pods');
}

const modelSource = fs.readFileSync(path.join(__dirname, '../../models/appControl.js'), 'utf8');
const modelAst = parser.parse(modelSource, { sourceType: 'module' });
const model = modelAst.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
const effect = model.properties.find(node => node.key.name === 'effects').value.properties.find(node => node.key.name === 'fetchPods');
const fetchPodsEffect = new Function('getPods', `return ({ ${modelSource.slice(effect.start, effect.end)} }).fetchPods;`)(() => {});
function pendingPodsEffect(action) {
  const generator = fetchPodsEffect(action, {
    call: (fn, payload) => ({ call: payload }),
    put: update => ({ put: update })
  });
  assert.deepStrictEqual(generator.next().value, { call: action.payload });
  return generator;
}
for (const change of ['pause', 'alias', 'unmount']) {
  const h = harness('overview.js', 'Index');
  const old = pendingPodsEffect(h.requests[0]);
  if (change === 'pause') h.update({ timers: false });
  if (change === 'alias') h.update({ appAlias: 'component-b' });
  if (change === 'unmount') h.page.componentWillUnmount();
  assert.strictEqual(old.next(pods).done, true, `${change} must stop the real DVA effect before savePods and callback`);
  assert.strictEqual(h.page.state.new_pods, null);
}
for (const withGuard of [false, true]) {
  let callbacks = 0;
  let active = true;
  const action = { payload: {}, callback: () => { callbacks += 1; } };
  if (withGuard) action.shouldApply = () => active;
  const request = pendingPodsEffect(action);
  assert.deepStrictEqual(request.next(pods).value, { put: { type: 'savePods', payload: pods.list } });
  active = false;
  assert.strictEqual(request.next().done, true);
  assert.strictEqual(callbacks, withGuard ? 0 : 1, 'guard must be rechecked after put; legacy callers remain compatible');
}
{
  let callbacks = 0;
  const request = pendingPodsEffect({ payload: {}, shouldApply: () => true, callback: () => { callbacks += 1; } });
  assert.strictEqual(request.next(pods).done, false);
  assert.strictEqual(request.next().done, true);
  assert.strictEqual(callbacks, 1);
}

// Evaluate the actual JSX attribute expressions in their original order, including
// spreads. This tests the parent-child connection without mounting the whole UI.
function descendant(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) { const result = descendant(child, predicate); if (result) return result; }
    } else {
      const result = descendant(value, predicate);
      if (result) return result;
    }
  }
  return null;
}
for (const filename of [drawer, 'index.js']) {
  const source = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
  const enabled = descendant(ast, node => node.type === 'VariableDeclarator' && node.id.name === 'pollingEnabled');
  const jsx = descendant(ast, node => node.type === 'JSXOpeningElement' && node.name.name === 'Com');
  const attrs = jsx.attributes.map(attribute => attribute.type === 'JSXSpreadAttribute'
    ? `...(${source.slice(attribute.argument.start, attribute.argument.end)})`
    : `${JSON.stringify(attribute.name.name)}: (${source.slice(attribute.value.expression.start, attribute.value.expression.end)})`);
  const evaluate = new Function('method', 'groupDetail', 'permissions', 'componentPermissions', 'status', 'data', 'isShowUpdate', 'pollingEnabled', `return ({ ${attrs.join(',')} });`);
  const enabledFromRender = new Function('componentTimer', 'pageVisible', `return ${source.slice(enabled.init.start, enabled.init.end)};`);
  for (const [componentTimer, pageVisible] of [[true, false], [false, true], [true, true]]) {
    const value = enabledFromRender(componentTimer, pageVisible);
    const props = evaluate.call({ props: { timers: true, pollingEnabled: true, match: { params: { timers: true } } }, state: {} }, 'docker', {}, {}, {}, {}, { timers: true }, false, value);
    assert.strictEqual(props.timers, componentTimer && pageVisible, 'spread props cannot override effective child timers');
    assert.strictEqual(props.pollingEnabled, componentTimer && pageVisible);
    const child = harness('overview.js', 'Index');
    child.update({ timers: props.timers });
    const before = child.requests.length;
    child.page.load();
    assert.strictEqual(child.requests.length, before, 'effective false timers must stop both child flows; true timers must deduplicate pending flows');
  }
}

const kbSource = fs.readFileSync(path.join(__dirname, '../../models/kubeblocks.js'), 'utf8');
const kbAst = parser.parse(kbSource, { sourceType: 'module' });
const kbModel = kbAst.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
const kbMethod = kbModel.properties.find(node => node.key.name === 'effects').value.properties.find(node => node.key.name === 'getClusterDetail');
const kbEffect = new Function('getClusterDetail', `return ({ ${kbSource.slice(kbMethod.start, kbMethod.end)} }).getClusterDetail;`)(() => {});
function pendingKbEffect(action) {
  const generator = kbEffect(action, {
    call: (fn, payload) => ({ call: payload }),
    put: update => ({ put: update })
  });
  assert.deepStrictEqual(generator.next().value, { call: action.payload });
  return generator;
}
const kbDetail = { status_code: 200, bean: { basic: { name: 'database' } } };
for (const change of ['pause', 'alias', 'unmount', 'hidden']) {
  const h = harness(drawer, 'Main', true);
  h.page.state.isShowKubeBlocksComponent = true;
  h.page.props.appDetail = { service: { service_alias: h.context.alias } };
  h.page.getKubeBlocksStatus(h.context.alias);
  assert.strictEqual(h.requests.length, 2);
  const detail = h.requests[1];
  assert.strictEqual(detail.payload.polling, true);
  h.requests[0].callback(running);
  h.page.getKubeBlocksStatus(h.context.alias);
  assert.strictEqual(h.requests.length, 2, 'initial and status refresh share one KB detail flow');
  const old = pendingKbEffect(detail);
  if (change === 'pause') h.page.closeComponentTimer();
  if (change === 'alias') { h.context.alias = 'component-b'; h.update({}); }
  if (change === 'unmount') h.page.componentWillUnmount();
  if (change === 'hidden') h.visible(false);
  assert.strictEqual(old.next(kbDetail).done, true, `${change} must reject the old KB detail before saveClusterDetail`);
  const errorCount = h.errors.length;
  detail.handleError({ status: 503 });
  assert.strictEqual(h.errors.length, errorCount);
  if (change === 'hidden') {
    h.visible(true);
    h.page.getKubeBlocksStatus(h.context.alias);
    assert.strictEqual(h.requests.filter(action => action.type === 'kubeblocks/getClusterDetail').length, 2,
      'old KB detail must not block visibility recovery');
  }
  if (change === 'alias') {
    const before = h.requests.length;
    h.page.getKubeBlocksStatus();
    assert.strictEqual(h.requests.length, before, 'stale appDetail alias cannot be requested under the new route');
    h.page.getKubeBlocksStatus(h.context.alias);
    assert.strictEqual(h.requests[h.requests.length - 1].payload.service_alias, 'component-b');
  }
}
{
  const h = harness(drawer, 'Main', true);
  h.page.getKubeBlocksStatus(h.context.alias);
  h.requests[1].handleError({ status: 503 });
  h.page.getKubeBlocksStatus(h.context.alias);
  assert.strictEqual(h.requests.length, 3, 'KB detail failure releases its flow gate');
  assert.strictEqual(h.timers.size, 0, 'KB details must not create an additional permanent timer');
}
for (const withGuard of [false, true]) {
  let active = true;
  let callbacks = 0;
  const action = { payload: {}, callback: () => { callbacks += 1; } };
  if (withGuard) action.shouldApply = () => active;
  const generator = pendingKbEffect(action);
  assert.deepStrictEqual(generator.next(kbDetail).value, { put: { type: 'saveClusterDetail', payload: kbDetail.bean } });
  active = false;
  assert.strictEqual(generator.next().done, true);
  assert.strictEqual(callbacks, withGuard ? 0 : 1);
}
{
  const source = fs.readFileSync(path.join(__dirname, '../../services/kubeblocks.js'), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module' });
  const method = ast.program.body.find(node => node.declaration && node.declaration.id.name === 'getClusterDetail').declaration;
  const observed = [];
  const service = new Function('request', 'apiconfig', `return (${source.slice(method.start, method.end)});`)(
    (url, options) => { observed.push({ url, options }); }, { baseUrl: '' }
  );
  const errorHandler = () => {};
  service({ team_name: 'team-a', service_alias: 'database-a' }, errorHandler);
  service({ team_name: 'team-a', service_alias: 'database-a', polling: true }, errorHandler);
  assert.deepStrictEqual(observed[0].options, { method: 'get', handleError: errorHandler }, 'ordinary KB detail caller retains legacy options');
  assert.deepStrictEqual(observed[1].options, { method: 'get', handleError: errorHandler, params: { polling: 'true' }, timeout: 12000 });
  assert.strictEqual(observed[1].url, '/console/teams/team-a/apps/database-a/kubeblocks/detail');
}

console.log('component polling lifecycle behavior tests passed');
