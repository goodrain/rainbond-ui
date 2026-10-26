const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const pluginInitialization = require('./pluginInitialization');
const {
  createPluginInitializationLoader,
  notifyEnterprisePluginsChanged,
  subscribeEnterprisePluginsChanged
} = pluginInitialization;

function loaderHarness() {
  const requests = [];
  const applied = [];
  const loader = createPluginInitializationLoader((payload, success, failure, shouldApply) => {
    requests.push({ payload, success, failure, shouldApply });
  }, (response, scope) => applied.push({ response, scope }));
  return { loader, requests, applied };
}

const scope = { enterpriseId: 'enterprise-a', regionName: 'region-a' };
const response = { status_code: 200, list: [{ name: 'rainbond-agent', installed: true }] };

test('one layout shares concurrent and sequential initial readers, with no module-level data cache', async () => {
  const h = loaderHarness();
  const first = h.loader.load(scope);
  const concurrent = h.loader.load(scope);
  assert.equal(first, concurrent);
  assert.equal(h.requests.length, 1);
  h.requests[0].success(response);
  assert.equal(await first, response);
  assert.equal(await h.loader.load(scope), response);
  assert.equal(h.requests.length, 1);
  const anotherLayout = loaderHarness();
  const independent = anotherLayout.loader.load(scope);
  assert.equal(anotherLayout.requests.length, 1);
  anotherLayout.requests[0].success({ list: [] });
  await independent;
});

test('force supersedes old pending reads, including Redux shouldApply, and keeps the fresh result', async () => {
  const h = loaderHarness();
  const old = h.loader.load(scope);
  const oldResult = assert.rejects(old, { code: 'PLUGIN_INITIALIZATION_STALE' });
  const fresh = h.loader.load({ ...scope, force: true });
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[0].shouldApply(), false);
  assert.equal(h.requests[1].shouldApply(), true);
  h.requests[1].success(response);
  await fresh;
  h.requests[0].success({ list: [] });
  await oldResult;
  assert.equal(await h.loader.load(scope), response);
  assert.equal(h.applied.length, 1);
});

test('enterprise and region scopes are independent and regional invalidation does not evict other regions', async () => {
  const h = loaderHarness();
  const scopes = [scope, { ...scope, enterpriseId: 'enterprise-b' }, { ...scope, regionName: 'region-b' }];
  const pending = scopes.map(value => h.loader.load(value));
  h.requests.forEach((request, index) => request.success({ list: [{ name: `plugin-${index}` }] }));
  await Promise.all(pending);
  assert.equal(h.requests.length, 3);
  h.loader.invalidate('region-a');
  await h.loader.load(scopes[2]);
  assert.equal(h.requests.length, 3);
  const fresh = h.loader.load(scope);
  assert.equal(h.requests.length, 4);
  h.requests[3].success(response);
  await fresh;
});

test('errors, undefined callbacks and business failures are not cached as empty success; retries stay usable', async () => {
  for (const invalid of [undefined, {}, { list: null }, { status_code: 403, list: [] }]) {
    const h = loaderHarness();
    const failed = assert.rejects(h.loader.load(scope));
    h.requests[0].success(invalid);
    await failed;
    assert.equal(h.applied.length, 0);
    const retry = h.loader.load(scope);
    assert.equal(h.requests.length, 2);
    h.requests[1].success({ list: [] });
    await retry;
  }
  const h = loaderHarness();
  const error = new Error('unavailable');
  const first = h.loader.load(scope);
  const second = h.loader.load(scope);
  const assertions = [first, second].map(promise => assert.rejects(promise, candidate => candidate === error));
  h.requests[0].failure(error);
  h.requests[0].success(undefined); // request.js can invoke its error handler and then resolve undefined.
  await Promise.all(assertions);
  const retry = h.loader.load(scope);
  h.requests[1].success(response);
  await retry;
});

test('explicit normalized business errors are not cached even when HTTP status and list shape look successful', async () => {
  for (const invalid of [
    { status_code: 200, business_code: 503, list: [] },
    { status_code: 200, _condition: 403, list: [] }
  ]) {
    const h = loaderHarness();
    const failed = assert.rejects(h.loader.load(scope), /Invalid enterprise plugin response/);
    h.requests[0].success(invalid);
    await failed;
    assert.equal(h.applied.length, 0);
    const retry = h.loader.load(scope);
    assert.equal(h.requests.length, 2);
    h.requests[1].success({ status_code: 200, business_code: 200, _condition: 200, list: [] });
    await retry;
  }
});

test('synchronous success exposes the same initialized promise to a reentrant consumer', async () => {
  let nested;
  let loader;
  loader = createPluginInitializationLoader((payload, success) => success(response), () => {
    nested = loader.load(scope);
  });
  const first = loader.load(scope);
  assert.equal(nested, first);
  assert.equal(await first, response);
});

test('dispose rejects late responses and never permits another layout read', async () => {
  const h = loaderHarness();
  const old = assert.rejects(h.loader.load(scope), { code: 'PLUGIN_INITIALIZATION_STALE' });
  h.loader.dispose();
  h.requests[0].success(response);
  await old;
  assert.equal(h.applied.length, 0);
  await assert.rejects(h.loader.load(scope), { code: 'PLUGIN_INITIALIZATION_STALE' });
});

test('invalidation settles old pending readers immediately and a cancelled DVA dispatch cannot leave a permanent pending entry', async () => {
  const h = loaderHarness();
  const pending = assert.rejects(h.loader.load(scope), { code: 'PLUGIN_INITIALIZATION_STALE' });
  h.loader.invalidate();
  await pending; // No transport callback is needed to release the old consumer.
  const requests = [];
  const loader = createPluginInitializationLoader(() => {
    requests.push(true);
    return Promise.resolve(undefined);
  });
  await assert.rejects(loader.load(scope), /without a response/);
  await assert.rejects(loader.load(scope), /without a response/);
  assert.equal(requests.length, 2);
});

test('invalidation events contain only explicit scopes, and unsubscribe releases owners', () => {
  const changes = [];
  const unsubscribe = subscribeEnterprisePluginsChanged(change => changes.push(change));
  notifyEnterprisePluginsChanged();
  notifyEnterprisePluginsChanged({ regionName: 'region-a' });
  notifyEnterprisePluginsChanged(scope);
  notifyEnterprisePluginsChanged({ enterpriseId: scope.enterpriseId });
  unsubscribe();
  notifyEnterprisePluginsChanged(scope);
  assert.deepEqual(changes, [scope, { enterpriseId: scope.enterpriseId, regionName: undefined }]);
});

test('a broken invalidation listener does not interrupt successful mutation or other owners', async () => {
  const changes = [];
  const stopBroken = subscribeEnterprisePluginsChanged(() => { throw new Error('listener failed'); });
  const stopHealthy = subscribeEnterprisePluginsChanged(change => changes.push(change));
  const install = serviceFunction('services/api.js', 'installPlugin', async () => response);
  assert.equal(await install({ enterprise_id: scope.enterpriseId, region_name: scope.regionName }), response);
  assert.deepEqual(changes, [scope]);
  stopBroken();
  stopHealthy();
});

const uiRoot = path.resolve(__dirname, '..');
function sourceFile(filename) {
  return fs.readFileSync(path.join(uiRoot, filename), 'utf8');
}

// Execute selected production methods instead of reproducing their request logic.
function productionClass(filename, className, methodNames, dependencies) {
  const source = sourceFile(filename);
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
  const node = ast.program.body.map(item => item.declaration || item)
    .find(item => item.type === 'ClassDeclaration' && item.id.name === className);
  assert.ok(node, className);
  const members = node.body.body.filter(item => item.key && methodNames.includes(item.key.name));
  const methods = members.map(item => source.slice(item.start, item.end)).join('\n');
  return new Function(...Object.keys(dependencies), `return class extends PureComponent { ${methods} };`)(...Object.values(dependencies));
}

class PureComponent {
  constructor(props) { this.props = props; }
  setState(update, callback) {
    const next = typeof update === 'function' ? update(this.state, this.props) : update;
    if (next) this.state = { ...this.state, ...next };
    if (callback) callback();
  }
}

function layoutHarness() {
  const requests = [];
  const writes = [];
  const Layout = productionClass('layouts/EnterpriseLayout.js', 'EnterpriseLayout', [
    'constructor', 'componentDidMount', 'componentDidUpdate', 'componentWillUnmount',
    'getPluginEnterpriseId', 'getPluginInitializationScope', 'syncPluginInitializationContext',
    'applyPluginInitialization', 'refreshPluginInitialization', 'handleEnterprisePluginsChanged',
    'isOverviewRoute', 'loadOverviewPlugins', 'handleLoadEnterpriseClusters', 'handlePluginList'
  ], {
    PureComponent, ...pluginInitialization,
    isMobile: false,
    getBreadcrumbNameMap: () => ({}),
    getMenuData: () => [],
    globalUtil: { getCurrEnterpriseId: () => scope.enterpriseId },
    pluginUtile: { isInstallEnterprisePlugin: list => list.some(item => item.name === 'enterprise-plugin') },
    window: { localStorage: { getItem: () => null, setItem: (...args) => writes.push(args) }, location: { href: '/' } }
  });
  const layout = new Layout({
    groups: [],
    match: { params: { eid: scope.enterpriseId } },
    location: { pathname: `/enterprise/${scope.enterpriseId}/index`, query: {} },
    currRegion: scope.regionName,
    currentUser: { user_id: 'user-a', enterprise_id: scope.enterpriseId },
    dispatch: action => { requests.push(action); }
  });
  layout.getEnterpriseList = () => {};
  layout.componentDidMount();
  layout.state.clusterList = [{ region_name: scope.regionName, status: '1' }, { region_name: 'region-b' }];
  return { layout, requests, writes, reads: () => requests.filter(action => action.type === 'global/getPluginList') };
}

function headerHarness(layout) {
  const requests = [];
  const gates = [];
  const clearedTimers = [];
  const applied = [];
  const callbacks = [];
  const Header = productionClass('components/GlobalHeader/index.js', 'GlobalHeader', [
    'constructor', 'componentDidUpdate', 'componentWillUnmount', 'getEnterpriseId',
    'getAgentPluginFetchKey', 'getFallbackPluginRegionName', 'isInstalledPlugin', 'fetchAgentPluginStatus'
  ], {
    PureComponent,
    isSuccessfulPluginResponse: pluginInitialization.isSuccessfulPluginResponse,
    React: { createRef: () => ({ current: null }) },
    cookie: { get: () => 'zh-CN' },
    globalUtil: { getCurrTeamName: () => '', getCurrRegionName: () => '', getCurrEnterpriseId: () => scope.enterpriseId },
    isPluginBaseId: (plugin, name) => plugin.name === name,
    cacheCopilotPluginNameFromList: () => {},
    clearTimeout: timer => clearedTimers.push(timer)
  });
  Header.prototype.checkIsTeamView = () => false;
  const header = new Header({
    enterprise: { enterprise_id: scope.enterpriseId },
    currentUser: { user_id: 'user-a', enterprise_id: scope.enterpriseId, is_enterprise_admin: true },
    ...(layout ? {
      loadEnterprisePlugins: layout.handlePluginList,
      pluginInitializationScope: layout.pluginInitializationScope,
      pluginInitializationVersion: layout.state.pluginInitializationVersion
    } : {}),
    dispatch: action => {
      if (action.type === 'agent/saveEntryGate') gates.push(action);
      else requests.push(action);
    }
  });
  header.scheduleAgentUpdate = () => {};
  header.updateSliderPosition = () => {};
  header.syncPluginStatusFromProps = () => {};
  header.syncPluginStatusFromList = list => {
    applied.push(list);
    header.state.agentPluginStatus = list.some(item => item.name === 'rainbond-agent') ? 'installed' : 'missing';
  };
  return { header, requests, applied, callbacks, gates, clearedTimers,
    fetch: options => header.fetchAgentPluginStatus({ callback: status => callbacks.push(status), ...options }) };
}

function currentHeaderRegions(h, regionNames = [scope.regionName]) {
  h.requests.filter(action => action.type === 'region/fetchEnterpriseClusters').at(-1)
    .callback({ list: regionNames.map(region_name => ({ region_name })) });
  return h.requests.filter(action => action.type === 'global/getPluginList').slice(-regionNames.length);
}

function establishInstalledHeader(h) {
  h.fetch();
  currentHeaderRegions(h)[0].callback(response);
  assert.equal(h.header.state.agentPluginStatus, 'installed');
}

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test('production Layout then Header reuse a completed plugin result, including all other regions', async () => {
  const l = layoutHarness();
  const initial = l.layout.handlePluginList(scope.regionName);
  l.reads()[0].callback(response);
  await initial;
  const h = headerHarness(l.layout);
  h.fetch();
  h.requests[0].callback({ list: [{ region_name: scope.regionName }, { region_name: 'region-b' }, { region_name: 'region-b' }] });
  assert.equal(l.reads().length, 2, 'one completed region is reused; the other distinct region gets one read');
  assert.equal(l.reads()[1].payload.region_name, 'region-b');
  l.reads()[1].callback({ list: [] });
  await flush();
  assert.deepEqual(h.callbacks, ['installed']);
  assert.equal(h.applied[0].length, 1);
  l.layout.componentWillUnmount();
});

test('production Layout and Header concurrent readers issue one plugin read, not two', async () => {
  const l = layoutHarness();
  const initial = l.layout.handlePluginList(scope.regionName);
  const h = headerHarness(l.layout);
  h.fetch();
  h.requests[0].callback({ list: [{ region_name: scope.regionName }] });
  assert.equal(l.reads().length, 1);
  l.reads()[0].callback(response);
  await initial;
  await flush();
  assert.deepEqual(h.callbacks, ['installed']);
  l.layout.componentWillUnmount();
});

test('production Header force starts a new generation and all same-scope waiting callbacks settle once', async () => {
  const l = layoutHarness();
  const h = headerHarness(l.layout);
  h.fetch();
  h.requests[0].callback({ list: [{ region_name: scope.regionName }] });
  h.fetch();
  assert.equal(h.requests.length, 1, 'another caller joins the pending aggregate');
  h.fetch({ force: true });
  h.requests[1].callback({ list: [{ region_name: scope.regionName }] });
  assert.equal(l.reads().length, 2);
  l.reads()[1].callback(response);
  await flush();
  l.reads()[0].callback({ list: [] });
  await flush();
  assert.deepEqual(h.callbacks, ['installed', 'installed', 'installed']);
  assert.equal(h.applied.length, 1);
  l.layout.componentWillUnmount();
});

test('a completed old promise cannot reapply its list after a synchronous forced response', async () => {
  const l = layoutHarness();
  const old = l.layout.handlePluginList(scope.regionName);
  l.reads()[0].callback(response);
  const fresh = l.layout.handlePluginList(scope.regionName, { force: true });
  const freshResponse = { list: [] };
  l.reads()[1].callback(freshResponse);
  await Promise.all([old, fresh]);
  assert.equal(l.layout.state.pluginList[scope.regionName], freshResponse.list);
  l.layout.componentWillUnmount();
});

test('a failing Header consumer does not prevent other callbacks or leave an in-flight lock', () => {
  const h = headerHarness();
  h.fetch({ callback: () => { throw new Error('consumer failed'); } });
  h.fetch();
  h.requests[0].callback({ list: [{ region_name: scope.regionName }] });
  assert.doesNotThrow(() => h.requests[1].callback(response));
  assert.deepEqual(h.callbacks, ['installed']);
  assert.equal(h.header.agentPluginFetchInFlight, false);
  assert.equal(h.header.agentPluginRequest, null);
});

test('production authorization and regional mutation invalidation refresh only matching enterprise and coalesce consumers', async () => {
  const l = layoutHarness();
  const initial = l.layout.handlePluginList(scope.regionName);
  l.reads()[0].callback(response);
  await initial;
  const oldVersion = l.layout.state.pluginInitializationVersion;
  notifyEnterprisePluginsChanged({ enterpriseId: 'other-enterprise', regionName: scope.regionName });
  assert.equal(l.layout.state.pluginInitializationVersion, oldVersion);
  notifyEnterprisePluginsChanged(scope);
  assert.equal(l.reads().length, 2);
  const h = headerHarness(l.layout);
  h.fetch();
  h.requests[0].callback({ list: [{ region_name: scope.regionName }] });
  assert.equal(l.reads().length, 2, 'header joins the layout invalidation read');
  l.reads()[1].callback({ list: [] });
  await flush();
  assert.deepEqual(h.callbacks, ['missing']);
  notifyEnterprisePluginsChanged({ enterpriseId: scope.enterpriseId });
  assert.equal(l.reads().length, 3, 'enterprise authorization invalidates every region snapshot');
  l.reads()[2].callback(response);
  await flush();
  l.layout.componentWillUnmount();
});

test('production region and user changes cannot reuse previous initialization or apply its late response', async () => {
  const l = layoutHarness();
  const first = l.layout.handlePluginList(scope.regionName);
  const failed = assert.rejects(first, { code: 'PLUGIN_INITIALIZATION_STALE' });
  const previousProps = l.layout.props;
  l.layout.props = { ...previousProps, location: { ...previousProps.location, query: { regionName: 'region-b' } } };
  assert.equal(l.reads()[0].shouldApply(), false, 'the parent props changed even before componentDidUpdate');
  l.layout.componentDidUpdate(previousProps);
  l.reads()[0].callback(response);
  await failed;
  assert.equal(l.reads()[0].shouldApply(), false);
  assert.equal(l.layout.state.pluginList[scope.regionName], undefined);
  const active = l.reads().slice(1);
  active.forEach(action => action.callback({ list: [] }));
  await flush();
  const previousUserProps = l.layout.props;
  l.layout.props = { ...previousUserProps, currentUser: { ...previousUserProps.currentUser, is_enterprise_admin: false } };
  l.layout.componentDidUpdate(previousUserProps);
  l.requests.filter(action => action.type === 'region/fetchEnterpriseClusters').at(-1)
    .callback({ status_code: 200, list: [{ region_name: scope.regionName }, { region_name: 'region-b' }] });
  assert.equal(l.reads().length, 3, 'a changed permission/user object cannot reuse successful snapshots');
  l.reads().slice(1).forEach(action => action.callback({ list: [] }));
  await flush();
  l.layout.componentWillUnmount();
});

test('ordinary enterprise page navigation shares successful layout initialization instead of adding plugin requests', async () => {
  const l = layoutHarness();
  const pending = [scope.regionName, 'region-b'].map(regionName => l.layout.handlePluginList(regionName));
  l.reads().forEach(action => action.callback({ list: [] }));
  await Promise.all(pending);
  for (const page of ['teams', 'settings', 'index']) {
    const previousProps = l.layout.props;
    l.layout.props = { ...previousProps, location: { pathname: `/enterprise/${scope.enterpriseId}/${page}`, query: {} } };
    l.layout.componentDidUpdate(previousProps);
    if (page === 'teams') {
      l.requests.filter(action => action.type === 'region/fetchEnterpriseClusters').at(-1)
        .callback({ status_code: 200, list: [{ region_name: scope.regionName }, { region_name: 'region-b' }] });
    }
    await flush();
    assert.equal(l.reads().length, 2, 'ordinary route changes may reuse both current-layout region snapshots');
  }
  l.layout.componentWillUnmount();
});

test('production region switch starts the selected region and enterprise switch does not reuse the old cluster list', async () => {
  const l = layoutHarness();
  const old = assert.rejects(l.layout.handlePluginList(scope.regionName), { code: 'PLUGIN_INITIALIZATION_STALE' });
  const previousProps = l.layout.props;
  l.layout.props = { ...previousProps, location: { ...previousProps.location, query: { regionName: 'region-b' } } };
  l.layout.componentDidUpdate(previousProps);
  await old;
  assert.equal(l.reads().length, 2);
  assert.equal(l.reads()[1].payload.region_name, 'region-b');
  l.reads()[1].callback({ list: [] });
  await flush();
  const previousEnterpriseProps = l.layout.props;
  l.layout.props = { ...previousEnterpriseProps, match: { params: { eid: 'enterprise-b' } },
    location: { pathname: '/enterprise/enterprise-b/index', query: {} } };
  l.layout.componentDidUpdate(previousEnterpriseProps);
  assert.equal(l.layout.state.clusterList.length, 0);
  assert.equal(l.reads().length, 2, 'old enterprise regions must not be queried under the new enterprise');
  const clusters = l.requests.filter(action => action.type === 'region/fetchEnterpriseClusters').at(-1);
  clusters.callback({ status_code: 200, list: [{ region_name: 'new-region' }] });
  assert.equal(l.reads()[2].payload.enterprise_id, 'enterprise-b');
  assert.equal(l.reads()[2].payload.region_name, 'new-region');
  l.reads()[2].callback({ list: [] });
  await flush();
  l.layout.componentWillUnmount();
});

test('production force failure remains retryable after an earlier success', () => {
  const h = headerHarness();
  h.fetch();
  h.requests[0].callback({ list: [{ region_name: scope.regionName }] });
  h.requests[1].callback(response);
  assert.deepEqual(h.callbacks, ['installed']);
  h.fetch({ force: true });
  h.requests[2].callback({ list: [{ region_name: scope.regionName }] });
  h.requests[3].handleError(new Error('failed forced read'));
  assert.equal(h.header.lastAgentPluginFetchKey, null);
  assert.equal(h.header.state.agentPluginStatus, 'installed', 'same-scope failure may retain its trusted result');
  assert.deepEqual(h.callbacks, ['installed', 'installed']);
  h.fetch();
  assert.equal(h.requests.length, 5);
});

for (const previousStatus of ['pending', 'installed']) {
  test(`production partial regional failure preserves ${previousStatus} instead of confirming missing`, () => {
    const h = headerHarness();
    if (previousStatus === 'installed') establishInstalledHeader(h);
    const appliedBefore = h.applied.length;
    h.fetch({ force: true });
    const reads = currentHeaderRegions(h, [scope.regionName, 'region-b']);
    reads[0].callback({ list: [] });
    reads[1].handleError(new Error('region unavailable'));
    assert.equal(h.header.state.agentPluginStatus, previousStatus);
    assert.equal(h.callbacks.at(-1), previousStatus);
    assert.equal(h.applied.length, appliedBefore, 'a partial empty result must not clear plugin/access state');
    assert.equal(h.header.lastAgentPluginFetchKey, null);
    assert.equal(h.header.agentPluginFetchInFlight, false);
    const beforeRetry = h.requests.length;
    h.fetch();
    assert.equal(h.requests.length, beforeRetry + 1, 'only an explicit retry starts a fresh aggregate');
  });
}

test('production partial regional success can confirm an observed AI plugin, but only complete success confirms absence', () => {
  const observed = headerHarness();
  observed.fetch();
  const partial = currentHeaderRegions(observed, [scope.regionName, 'region-b']);
  partial[0].callback(response);
  partial[1].handleError(new Error('region unavailable'));
  assert.equal(observed.header.state.agentPluginStatus, 'installed');
  assert.deepEqual(observed.callbacks, ['installed']);
  assert.equal(observed.header.lastAgentPluginFetchKey, null);

  const absent = headerHarness();
  absent.fetch();
  const complete = currentHeaderRegions(absent, [scope.regionName, 'region-b']);
  complete.forEach(read => read.callback({ list: [] }));
  assert.equal(absent.header.state.agentPluginStatus, 'missing');
  assert.deepEqual(absent.callbacks, ['missing']);
  assert.equal(absent.header.lastAgentPluginFetchKey, absent.header.getAgentPluginFetchKey());
});

test('production Header treats a normalized business error as failed, not confirmed missing', () => {
  for (const failure of [{ business_code: 503 }, { _condition: 403 }]) {
    const h = headerHarness();
    h.fetch();
    currentHeaderRegions(h)[0].callback({ status_code: 200, list: [], ...failure });
    assert.deepEqual(h.callbacks, ['pending']);
    assert.equal(h.applied.length, 0);
    assert.equal(h.header.lastAgentPluginFetchKey, null);
  }
});

for (const [label, discoveryResult, networkFailure] of [
  ['network failure', undefined, true],
  ['HTTP 200 business failure', { status_code: 200, business_code: 503, list: [] }],
  ['missing response', undefined],
  ['missing list', { status_code: 200 }],
  ['invalid list', { status_code: 200, list: null }],
  ['missing name in one discovered region', { list: [{ region_name: scope.regionName }, {}] }],
  ['empty name in one discovered region', { list: [{ region_name: scope.regionName }, { region_name: ' ' }] }],
  ['null entry in the discovery list', { list: [{ region_name: scope.regionName }, null] }],
  ['no usable region names', { list: [{}, { region_name: null }] }]
]) {
  test(`production untrusted discovery (${label}) cannot confirm absence or cache a fallback empty result`, () => {
    const h = headerHarness();
    h.header.getFallbackPluginRegionName = () => scope.regionName;
    h.fetch();
    const discovery = h.requests[0];
    if (networkFailure) discovery.handleError(new Error('discovery unavailable'));
    else discovery.callback(discoveryResult);
    const reads = h.requests.filter(action => action.type === 'global/getPluginList');
    assert.equal(reads.length, 1);
    assert.equal(reads[0].payload.region_name, scope.regionName);
    reads[0].callback({ list: [] });
    assert.deepEqual(h.callbacks, ['pending']);
    assert.equal(h.header.state.agentPluginStatus, 'pending');
    assert.equal(h.header.lastAgentPluginFetchKey, null);
    assert.equal(h.applied.length, 0);
    assert.equal(h.header.agentPluginFetchInFlight, false);
    assert.equal(h.requests.length, 2, 'there is no implicit discovery retry loop');
    h.fetch();
    assert.equal(h.requests.length, 3, 'a later explicit request can retry discovery');
  });
}

test('production fallback can confirm an observed installed plugin without claiming discovery completeness', () => {
  for (const networkFailure of [false, true]) {
    const h = headerHarness();
    h.header.getFallbackPluginRegionName = () => scope.regionName;
    h.fetch();
    if (networkFailure) h.requests[0].handleError(new Error('discovery unavailable'));
    else h.requests[0].callback({ status_code: 200, business_code: 503, list: [] });
    h.requests[1].callback(response);
    assert.deepEqual(h.callbacks, ['installed']);
    assert.equal(h.header.state.agentPluginStatus, 'installed');
    assert.equal(h.header.lastAgentPluginFetchKey, null);
  }
});

test('production trustworthy empty discovery confirms no installed regions without probing a stale fallback', () => {
  const h = headerHarness();
  h.header.getFallbackPluginRegionName = () => 'stale-region';
  h.fetch();
  h.requests[0].callback({ status_code: 200, business_code: 200, _condition: 200, list: [] });
  assert.deepEqual(h.callbacks, ['missing']);
  assert.equal(h.header.state.agentPluginStatus, 'missing');
  assert.equal(h.header.lastAgentPluginFetchKey, h.header.getAgentPluginFetchKey());
  assert.equal(h.requests.length, 1, 'trusted zero clusters does not mean a failed-discovery fallback');
});

for (const [label, changeProps] of [
  ['enterprise', props => ({ ...props, eid: 'enterprise-b', enterprise: { enterprise_id: 'enterprise-b' }, pluginInitializationScope: 'enterprise-b:region-a' })],
  ['user/permission', props => ({ ...props, currentUser: { ...props.currentUser, is_enterprise_admin: false } })],
  ['initialization region scope', props => ({ ...props, pluginInitializationScope: 'enterprise-a:region-b' })]
]) {
  test(`production ${label} change cannot inherit installed when all new reads fail`, () => {
    const h = headerHarness();
    establishInstalledHeader(h);
    h.header.lastPluginListKey = 'old-list';
    h.header.lastAgentAccessKey = 'old-access';
    h.header.agentUpdateTimer = 123;
    const previousProps = h.header.props;
    h.header.props = changeProps(previousProps);
    h.header.componentDidUpdate(previousProps);
    assert.equal(h.header.state.agentPluginStatus, 'pending');
    assert.equal(h.header.lastPluginListKey, null);
    assert.equal(h.header.lastAgentAccessKey, null);
    assert.equal(h.header.agentUpdateTimer, null);
    assert.ok(h.clearedTimers.includes(123));
    assert.equal(h.gates.at(-1).payload.pluginStatus, 'pending');
    assert.equal(h.gates.at(-1).payload.accessLoaded, false);
    h.fetch(); // Join the automatic new-scope read with a real consumer callback.
    currentHeaderRegions(h)[0].handleError(new Error('new scope unavailable'));
    assert.equal(h.header.state.agentPluginStatus, 'pending');
    assert.deepEqual(h.callbacks, ['installed', 'pending']);
    assert.equal(h.header.lastAgentPluginFetchKey, null);
    assert.equal(h.applied.length, 1, 'the failed scope must not apply an empty success or the old scope list');
  });
}

test('production standalone Header releases cancelled or handled-empty DVA requests without caching failure', async () => {
  const h = headerHarness();
  h.header.props.dispatch = action => {
    h.requests.push(action);
    return Promise.resolve(undefined);
  };
  h.fetch();
  await flush();
  assert.equal(h.header.agentPluginFetchInFlight, false);
  assert.equal(h.header.lastAgentPluginFetchKey, null);
  assert.deepEqual(h.callbacks, ['pending']);
});

test('production Header fallback keeps standalone/team force reads, retries errors and ignores unmounted callbacks', () => {
  const h = headerHarness();
  h.header.checkIsTeamView = () => true;
  h.fetch();
  assert.equal(h.requests.length, 0);
  h.fetch({ force: true });
  h.requests[0].callback({ list: [{ region_name: scope.regionName }] });
  const read = h.requests[1];
  assert.equal(read.type, 'global/getPluginList');
  read.handleError(new Error('unavailable'));
  read.callback(undefined);
  assert.equal(h.header.lastAgentPluginFetchKey, null, 'error must not permanently suppress retries');
  h.fetch({ force: true });
  h.requests[2].callback({ list: [{ region_name: scope.regionName }] });
  const late = h.requests[3];
  h.header.componentWillUnmount();
  assert.equal(late.shouldApply(), false);
  late.callback(response);
  assert.equal(h.applied.length, 0);
});

test('production Header user/permission changes discard old callbacks and revoke the previous admin entry', () => {
  const h = headerHarness();
  assert.equal(h.header.state.isAdmin, true);
  h.fetch();
  const previousProps = h.header.props;
  h.header.props = { ...previousProps, currentUser: { ...previousProps.currentUser, is_enterprise_admin: false } };
  h.header.componentDidUpdate(previousProps);
  assert.equal(h.header.state.isAdmin, false);
  h.requests[0].callback({ list: [{ region_name: scope.regionName }] });
  assert.equal(h.requests.length, 2, 'old cluster response must not start another plugin read');
  h.requests[1].callback({ list: [{ region_name: scope.regionName }] });
  h.fetch();
  h.requests[2].callback({ list: [] });
  assert.deepEqual(h.callbacks, ['missing'], 'only the new user consumer may continue');
});

function serviceFunction(filename, name, request) {
  const source = sourceFile(filename);
  const ast = parser.parse(source, { sourceType: 'module' });
  const node = ast.program.body.map(item => item.declaration || item)
    .find(item => item.type === 'FunctionDeclaration' && item.id.name === name);
  assert.ok(node, name);
  return new Function('request', 'apiconfig', 'notifyEnterprisePluginsChanged', 'isSuccessfulPluginResponse', `return (${source.slice(node.start, node.end)});`)(
    request, { baseUrl: '/api' }, notifyEnterprisePluginsChanged, pluginInitialization.isSuccessfulPluginResponse
  );
}

test('production installation and authorization services invalidate only successful captured scopes and preserve handlers/results', async () => {
  const changes = [];
  const unsubscribe = subscribeEnterprisePluginsChanged(change => changes.push(change));
  for (const name of ['installPlugin', 'uploadEnterpriseLicense']) {
    let resolve;
    let options;
    const request = (url, requestOptions) => {
      options = requestOptions;
      return new Promise(resolvePromise => { resolve = resolvePromise; });
    };
    const service = serviceFunction(name === 'installPlugin' ? 'services/api.js' : 'services/region.js', name, request);
    const input = { enterprise_id: scope.enterpriseId, region_name: scope.regionName, plugin_id: 'plugin-a', authz_code: 'fixture-placeholder' };
    const handler = () => {};
    const result = service(input, handler);
    input.enterprise_id = 'changed-after-request';
    input.region_name = 'changed-after-request';
    resolve(response);
    assert.equal(await result, response);
    assert.equal(options.handleError, handler);
  }
  assert.deepEqual(changes, [scope, { enterpriseId: scope.enterpriseId, regionName: undefined }]);
  const beforeFailure = changes.length;
  for (const failed of [undefined, { status_code: 403 }, { status_code: 503 },
    { status_code: 200, business_code: 503 }, { status_code: 200, _condition: 403 }]) {
    const install = serviceFunction('services/api.js', 'installPlugin', async () => failed);
    assert.equal(await install({ enterprise_id: scope.enterpriseId, region_name: scope.regionName }), failed);
  }
  assert.equal(changes.length, beforeFailure);
  unsubscribe();
});

test('production Redux plugin effect guards old store writes but still settles the request callback', () => {
  const source = sourceFile('models/global.js');
  const ast = parser.parse(source, { sourceType: 'module' });
  const model = ast.program.body.find(item => item.type === 'ExportDefaultDeclaration').declaration;
  const effects = model.properties.find(item => item.key.name === 'effects').value;
  const method = effects.properties.find(item => item.key.name === 'getPluginList');
  const getPluginList = () => {};
  const effect = new Function('getPluginList', 'isSuccessfulPluginResponse', `return ({${source.slice(method.start, method.end)}}).getPluginList;`)(
    getPluginList, pluginInitialization.isSuccessfulPluginResponse
  );
  const called = [];
  const generator = effect({ payload: scope, shouldApply: () => false, callback: result => called.push(result) }, {
    call: (...args) => ({ call: args }),
    put: (...args) => ({ put: args })
  });
  assert.ok(generator.next().value.call);
  const finished = generator.next(response);
  assert.equal(finished.done, true);
  assert.deepEqual(called, [response]);
  const invalid = { status_code: 200, business_code: 503, list: [] };
  const invalidResult = [];
  const invalidGenerator = effect({ payload: scope, shouldApply: () => true, callback: result => invalidResult.push(result) }, {
    call: (...args) => ({ call: args }), put: (...args) => ({ put: args })
  });
  invalidGenerator.next();
  assert.equal(invalidGenerator.next(invalid).done, true, 'explicit business failure must not yield a store write');
  assert.deepEqual(invalidResult, [invalid], 'the request owner must still receive the failure response to settle');
});

test('production installation completion notifies its captured region once, not a later selected scope', () => {
  const changes = [];
  const unsubscribe = subscribeEnterprisePluginsChanged(change => changes.push(change));
  const Table = productionClass('pages/Extension/pluginCapacity/pluginTable.js', 'Index', ['completeInstallIfRunning'], {
    PureComponent, notifyEnterprisePluginsChanged, notification: { success() {} }
  });
  const table = new Table({ regionName: 'later-region' });
  table.state = { installingPlugins: { 'plugin-a': true }, confirmInstallPlugin: {} };
  table.stopInstallPolling = () => {};
  table.stopElapsedTimer = () => {};
  table.completeInstallIfRunning('plugin-a', [{ plugin_id: 'plugin-a', status: 'STARTING' }], scope);
  assert.equal(changes.length, 0);
  table.completeInstallIfRunning('plugin-a', [{ plugin_id: 'plugin-a', status: 'RUNNING' }], scope);
  table.completeInstallIfRunning('plugin-a', [{ plugin_id: 'plugin-a', status: 'RUNNING' }], scope);
  assert.deepEqual(changes, [scope]);
  unsubscribe();
});

test('layout passes a scoped loader rather than substituting official or market plugin datasets', () => {
  const layout = sourceFile('layouts/EnterpriseLayout.js');
  assert.match(layout, /loadEnterprisePlugins=\{this\.handlePluginList\}/);
  const helper = sourceFile('utils/pluginInitialization.js');
  assert.doesNotMatch(helper, /localStorage|sessionStorage|officialplugins|platform-plugins/);
});
