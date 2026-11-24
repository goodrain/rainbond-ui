const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const helpers = require('./vmNetworkHelpers');

const filename = path.join(__dirname, 'component/Basic/VMProfilePanel.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [
    [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default
  ],
  plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
}).code;

function panelHarness() {
  const current = { team: 'team-a', region: 'region-a', app: '868', refresh: 'read-1' };
  const calls = [];
  const confirmations = [];
  const timers = new Map();
  let timerId = 0;
  const api = {
    ports: async () => ({ status_code: 200, list: [{ is_inner_service: true, k8s_service_name: 'internal-service' }] }),
    service: async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.9' } } })
  };
  const exported = {};
  vm.runInNewContext(code, {
    exports: exported,
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    require(name) {
      if (name === 'react') return React;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'dva/router') return { routerRedux: { push: target => ({ type: 'navigate', target }) } };
      if (name === 'umi') return { FormattedMessage: props => React.createElement('span', null, props.id) };
      if (name === 'antd') return {
        Form: { create: () => Component => Component },
        Select: { Option: 'Option' },
        Alert: 'Alert', Button: 'Button', Card: 'Card', Col: 'Col', Icon: 'Icon', InputNumber: 'InputNumber',
        Modal: { confirm: options => confirmations.push(options) }, Row: 'Row', Switch: 'Switch', Tag: 'Tag', Tooltip: 'Tooltip', notification: {}
      };
      if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
      if (name.endsWith('/services/app')) return {
        getPorts: options => { calls.push({ method: 'ports', options }); return api.ports(options); }
      };
      if (name.endsWith('/services/teamResource')) return {
        getNsResource: options => { calls.push({ method: 'service', options }); return api.service(options); }
      };
      if (name.endsWith('/utils/global')) return { default: undefined,
        getCurrTeamName: () => current.team, getCurrRegionName: () => current.region,
        getAppID: () => current.app, getRefresh: () => current.refresh
      };
      if (name.endsWith('/vmNetworkHelpers')) return helpers;
      if (name.endsWith('.less')) return new Proxy({}, { get: (_, key) => key });
      return {};
    }
  }, { filename });
  const actions = [];
  const panel = new exported.VMProfilePanel({
    serviceAlias: 'vm-a', vmProfile: { network: {}, runtime: {} },
    dispatch: action => actions.push(action)
  });
  panel.mounted = true;
  panel.setState = (change, callback) => {
    panel.state = { ...panel.state, ...(typeof change === 'function' ? change(panel.state) : change) };
    if (callback) callback();
  };
  let latestNetworkRead;
  const fetchClusterIP = panel.fetchClusterIP;
  panel.fetchClusterIP = (...args) => {
    latestNetworkRead = fetchClusterIP(...args);
    return latestNetworkRead;
  };
  const runNextTimer = async () => {
    const next = timers.entries().next().value;
    assert.ok(next, 'expected an automatic address retry');
    const [id, timer] = next;
    timers.delete(id);
    await timer.callback();
    return timer.delay;
  };
  return { panel, current, api, calls, actions, confirmations, timers, runNextTimer,
    settleNetworkRead: () => latestNetworkRead };
}

const okPorts = { status_code: 200, list: [{ is_inner_service: true, k8s_service_name: 'internal-service' }] };

test('the profile preserves a newer VM read when an older alias finishes late', async () => {
  const h = panelHarness();
  let resolveOld;
  h.api.ports = options => options.app_alias === 'vm-a'
    ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(okPorts);
  h.api.service = async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
  const oldRead = h.panel.fetchClusterIP();
  h.panel.props = { ...h.panel.props, serviceAlias: 'vm-b' };
  await h.panel.fetchClusterIP();
  assert.equal(h.panel.state.clusterIP, '10.43.12.10');
  resolveOld(okPorts);
  await oldRead;
  assert.equal(h.panel.state.clusterIP, '10.43.12.10');
  assert.equal(h.panel.state.networkStatus, 'ready');
  assert.equal(h.calls.filter(call => call.method === 'service').length, 1);
});

test('switching team, cluster or application invalidates a pending profile read', async () => {
  for (const key of ['team', 'region', 'app']) {
    const h = panelHarness();
    let resolveService;
    h.api.service = () => new Promise(resolve => { resolveService = resolve; });
    const pending = h.panel.fetchClusterIP();
    await Promise.resolve();
    h.current[key] = 'another-scope';
    resolveService({ status_code: 200, bean: { spec: { clusterIP: '10.43.99.9' } } });
    await pending;
    assert.equal(h.panel.state.clusterIP, '');
    assert.equal(h.panel.state.networkStatus, 'loading');
  }
});

test('unmount prevents the final network address update', async () => {
  const h = panelHarness();
  let resolvePorts;
  h.api.ports = () => new Promise(resolve => { resolvePorts = resolve; });
  const pending = h.panel.fetchClusterIP();
  h.panel.componentWillUnmount();
  resolvePorts(okPorts);
  await pending;
  assert.equal(h.panel.state.clusterIP, '');
  assert.equal(h.calls.filter(call => call.method === 'service').length, 0);
});

test('a user retry can replace a failed read with the actual service address', async () => {
  const h = panelHarness();
  h.api.ports = async () => undefined;
  await h.panel.fetchClusterIP();
  assert.equal(h.panel.state.networkStatus, 'read-failed');
  h.api.ports = async () => okPorts;
  await h.panel.fetchClusterIP();
  assert.equal(h.panel.state.networkStatus, 'ready');
  assert.equal(h.panel.state.clusterIP, '10.43.12.9');
  assert.equal(h.timers.size, 0);
});

test('a Service still being created updates automatically when its ClusterIP appears', async () => {
  const h = panelHarness();
  h.api.service = async () => ({ status_code: 404 });
  await h.panel.fetchClusterIP();
  assert.equal(h.panel.state.networkStatus, 'service-pending');
  assert.equal(h.panel.state.clusterIP, '');
  assert.equal(h.timers.size, 1);
  h.api.service = async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
  assert.equal(await h.runNextTimer(), 2000);
  assert.equal(h.panel.state.networkStatus, 'ready');
  assert.equal(h.panel.state.clusterIP, '10.43.12.10');
  assert.equal(h.timers.size, 0);
});

test('an actual failure remains visible during automatic recovery and retains manual retry', async () => {
  const h = panelHarness();
  h.api.service = async () => { throw new Error('temporary transport failure'); };
  await h.panel.fetchClusterIP();
  assert.equal(h.panel.state.networkStatus, 'read-failed');
  const retry = elements(h.panel.renderInternalAddress()).find(element => element.props?.onClick === h.panel.fetchClusterIP);
  assert.ok(retry);
  let resolveService;
  h.api.service = () => new Promise(resolve => { resolveService = resolve; });
  const recovery = h.runNextTimer();
  await Promise.resolve();
  assert.equal(h.panel.state.networkStatus, 'read-failed');
  assert.equal(h.timers.size, 0, 'another retry cannot start while this read is pending');
  resolveService({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
  await recovery;
  assert.equal(h.panel.state.networkStatus, 'ready');
  assert.equal(h.panel.state.clusterIP, '10.43.12.10');
  assert.equal(h.timers.size, 0);
});

test('repeated true failures stop automatic retries, and manual retry starts a new recovery attempt', async () => {
  const h = panelHarness();
  h.api.service = async () => ({ status_code: 500 });
  await h.panel.fetchClusterIP();
  const delays = [];
  while (h.timers.size) {
    assert.ok(delays.length < 4, 'true failures must have a bounded automatic retry count');
    delays.push(await h.runNextTimer());
  }
  assert.deepEqual(delays, [2000, 5000, 10000]);
  assert.equal(h.panel.state.networkStatus, 'read-failed');
  assert.equal(h.calls.filter(call => call.method === 'service').length, 4);
  await h.panel.fetchClusterIP({ type: 'click' });
  assert.equal(h.timers.size, 1);
  h.api.service = async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
  assert.equal(await h.runNextTimer(), 2000);
  assert.equal(h.panel.state.networkStatus, 'ready');
  assert.equal(h.timers.size, 0);
});

test('a slow initial Service keeps waiting with capped backoff and no overlapping reads', async () => {
  const h = panelHarness();
  h.panel.props = { ...h.panel.props, status: { status: 'running' } };
  h.api.service = async () => ({ status_code: 200, bean: { spec: {} } });
  await h.panel.fetchClusterIP();
  const delays = [];
  for (let retry = 0; retry < 6; retry += 1) {
    assert.equal(h.timers.size, 1);
    delays.push(await h.runNextTimer());
    assert.equal(h.panel.state.networkStatus, 'service-pending');
  }
  assert.deepEqual(delays, [2000, 5000, 10000, 30000, 30000, 30000]);
  h.api.service = async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
  await h.runNextTimer();
  assert.equal(h.panel.state.clusterIP, '10.43.12.10');
  assert.equal(h.timers.size, 0);
});

test('stopped VMs wait without polling, and a new start triggers address recovery', async () => {
  const h = panelHarness();
  h.panel.props = { ...h.panel.props, status: { status: 'closed' } };
  h.api.service = async () => ({ status_code: 404 });
  await h.panel.fetchClusterIP();
  assert.equal(h.panel.state.networkStatus, 'service-pending');
  assert.equal(h.timers.size, 0);
  const previous = h.panel.props;
  h.panel.props = { ...previous, status: { status: 'starting' } };
  h.panel.componentDidUpdate(previous);
  await h.settleNetworkRead();
  assert.equal(h.timers.size, 1);
  h.api.service = async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
  await h.runNextTimer();
  assert.equal(h.panel.state.clusterIP, '10.43.12.10');
});

test('runtime transitions refresh once while equivalent profile objects do not repeat reads', async () => {
  const h = panelHarness();
  let refreshes = 0;
  h.panel.fetchClusterIP = () => { refreshes += 1; };
  for (const change of [
    { status: { status: 'starting' } },
    { status: { status: 'running' } },
    { vmProfile: { network: { current_pod_ip: '10.42.0.9' }, runtime_status: { start_time: 'start-a' } } },
    { vmProfile: { network: { current_pod_ip: '10.42.0.9' }, runtime_status: { start_time: 'start-b' } } }
  ]) {
    const previous = h.panel.props;
    h.panel.props = { ...previous, ...change };
    h.panel.componentDidUpdate(previous);
  }
  assert.equal(refreshes, 4);
  const previous = h.panel.props;
  h.panel.props = JSON.parse(JSON.stringify(previous));
  h.panel.componentDidUpdate(previous);
  assert.equal(refreshes, 4);
});

test('an armed retry cannot query an old component, team, region or application', async () => {
  for (const key of ['alias', 'team', 'region', 'app']) {
    const h = panelHarness();
    h.api.service = async () => ({ status_code: 404 });
    await h.panel.fetchClusterIP();
    const staleTimer = h.timers.values().next().value;
    const previous = h.panel.props;
    if (key === 'alias') h.panel.props = { ...previous, serviceAlias: 'vm-b' };
    else h.current[key] = 'new-scope';
    h.panel.componentDidUpdate(previous);
    await h.settleNetworkRead();
    const callsBeforeStaleTimer = h.calls.length;
    assert.equal(h.timers.size, 1);
    await staleTimer.callback();
    assert.equal(h.calls.length, callsBeforeStaleTimer);
    assert.equal(h.timers.size, 1, 'an obsolete callback must not clear the new scope timer');
    h.api.service = async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
    await h.runNextTimer();
    assert.equal(h.panel.state.clusterIP, '10.43.12.10');
    const ports = h.calls.filter(call => call.method === 'ports').pop().options;
    const service = h.calls.filter(call => call.method === 'service').pop().options;
    assert.equal(ports.app_alias, h.panel.props.serviceAlias);
    assert.equal(ports.team_name, h.current.team);
    assert.equal(service.region, h.current.region);
    assert.equal(h.timers.size, 0);
  }
});

test('unmount and leaving the network section clear armed retries', async () => {
  for (const destination of ['unmount', 'acceleration', 'connections']) {
    const h = panelHarness();
    h.api.service = async () => ({ status_code: 404 });
    await h.panel.fetchClusterIP();
    const staleTimer = h.timers.values().next().value;
    if (destination === 'unmount') h.panel.componentWillUnmount();
    else {
      const previous = h.panel.props;
      h.panel.props = { ...previous, section: destination };
      h.panel.componentDidUpdate(previous);
    }
    assert.equal(h.timers.size, 0);
    const callsBeforeStaleTimer = h.calls.length;
    await staleTimer.callback();
    assert.equal(h.calls.length, callsBeforeStaleTimer);
  }
});

test('manual refresh supersedes an in-flight automatic result', async () => {
  const h = panelHarness();
  h.api.service = async () => ({ status_code: 404 });
  await h.panel.fetchClusterIP();
  let resolveAutomatic;
  h.api.service = () => new Promise(resolve => { resolveAutomatic = resolve; });
  const automatic = h.runNextTimer();
  await Promise.resolve();
  h.api.service = async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
  await h.panel.fetchClusterIP();
  resolveAutomatic({ status_code: 200, bean: { spec: { clusterIP: '10.43.99.9' } } });
  await automatic;
  assert.equal(h.panel.state.clusterIP, '10.43.12.10');
  assert.equal(h.timers.size, 0);
});

test('a late result from the previous runtime cannot overwrite the same VM after restart', async () => {
  const h = panelHarness();
  h.panel.props = { ...h.panel.props, status: 'running' };
  let resolveOld;
  h.api.service = () => new Promise(resolve => { resolveOld = resolve; });
  const oldRead = h.panel.fetchClusterIP();
  await Promise.resolve();
  const previous = h.panel.props;
  h.panel.props = { ...previous, vmProfile: { network: { current_pod_ip: '10.42.0.10' }, runtime: {} } };
  h.api.service = async () => ({ status_code: 200, bean: { spec: { clusterIP: '10.43.12.10' } } });
  h.panel.componentDidUpdate(previous);
  await h.settleNetworkRead();
  resolveOld({ status_code: 200, bean: { spec: { clusterIP: '10.43.99.9' } } });
  await oldRead;
  assert.equal(h.panel.state.clusterIP, '10.43.12.10');
  assert.equal(h.timers.size, 0);
});

function textNodes(element) {
  if (element === undefined || element === null || typeof element === 'boolean') return '';
  if (typeof element === 'string' || typeof element === 'number') return String(element);
  if (Array.isArray(element)) return element.map(textNodes).join(' ');
  return `${element.props?.id || ''} ${textNodes(element.props?.children)}`;
}

function elements(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(elements);
  return [element, ...elements(element.props?.children), ...elements(element.props?.extra)];
}

test('the default profile still contains the original four cards inside its overview card', () => {
  const h = panelHarness();
  const cards = elements(h.panel.render()).filter(element => element.type === 'Card');
  assert.equal(cards.length, 5);
  assert.deepEqual(cards.map(card => (card.props.title.props?.id || textNodes(card.props.title)).trim()).filter(Boolean), [
    'componentOverview.body.tab.overview.vmProfile',
    'componentOverview.body.tab.overview.vmAssetInfo',
    'componentOverview.body.tab.overview.vmNetworkInfo',
    'componentOverview.body.tab.overview.vmAccelerationInfo',
    'componentOverview.body.tab.overview.vmConnectionInfo'
  ]);
  assert.ok(cards.slice(1).every(card => card.props.bordered === false));
});

test('network section keeps real addresses, the original pin confirmation and configuration route', () => {
  const h = panelHarness();
  h.panel.props = { ...h.panel.props, section: 'network', networkTitle: 'Connect to VM',
    vmProfile: { network: { current_pod_ip: '10.42.0.9' }, runtime: {} } };
  h.panel.state = { ...h.panel.state, clusterIP: '10.43.12.9', networkStatus: 'ready' };
  const view = h.panel.render();
  assert.equal(view.type, 'Card');
  assert.equal(view.props.bordered, true);
  assert.ok(textNodes(view.props.title).includes('Connect to VM'));
  const content = textNodes(view);
  assert.ok(content.includes('10.43.12.9'));
  assert.ok(content.includes('10.42.0.9'));
  assert.ok(!content.includes('vmGpu'));
  const pinSwitch = elements(view).find(element => element.type === 'Switch');
  assert.equal(pinSwitch.props.onChange, h.panel.handleFixedIPChange);
  pinSwitch.props.onChange(true);
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.confirmations[0].title, 'componentOverview.body.tab.overview.vmFixedIPEnableTitle');
  assert.equal(h.calls.length, 0, 'rendering or opening the existing confirmation cannot mutate the VM');
  const configure = elements(view).find(element => element.type === 'Button' && element.props.onClick === h.panel.handleConfigurePorts);
  configure.props.onClick();
  assert.equal(h.actions[0].type, 'navigate');
});

test('acceleration section reuses the runtime and existing edit action without loading networking', () => {
  const h = panelHarness();
  h.panel.props = { ...h.panel.props, section: 'acceleration',
    vmProfile: { runtime: { gpu_enabled: true, gpu_resources: ['nvidia.com/gpu'], usb_enabled: false } } };
  const view = h.panel.render();
  assert.equal(view.type, 'Card');
  assert.equal(view.props.title.props.id, 'componentOverview.body.tab.overview.vmAccelerationInfo');
  assert.ok(textNodes(view).includes('nvidia.com/gpu'));
  assert.equal(elements(view).find(element => element.type === 'Button').props.onClick, h.panel.handleEdit);
  let networkReads = 0;
  h.panel.fetchClusterIP = () => { networkReads += 1; };
  h.panel.componentDidMount();
  assert.equal(networkReads, 0);
});

test('connections section exposes only the server VNC URL and preserves the pending state when absent', () => {
  const h = panelHarness();
  const vncUrl = 'http://console.invalid/vnc_lite.html?path=vmi/example/vnc';
  h.panel.props = { ...h.panel.props, section: 'connections',
    vmProfile: { connections: { vnc_url: vncUrl }, asset: { reference_count: 2 } } };
  let networkReads = 0;
  h.panel.fetchClusterIP = () => { networkReads += 1; };
  h.panel.componentDidMount();
  assert.equal(networkReads, 0);
  const view = h.panel.render();
  assert.equal(view.props.title.props.id, 'componentOverview.body.tab.overview.vmConnectionInfo');
  const openVnc = elements(view).find(element => element.type === 'Button' && element.props.href);
  assert.equal(openVnc.props.href, vncUrl);
  assert.equal(openVnc.props.target, '_blank');
  assert.ok(!textNodes(view).includes('vmGpu'));
  h.panel.props = { ...h.panel.props, vmProfile: { connections: {}, asset: {} } };
  const pending = h.panel.render();
  assert.ok(textNodes(pending).includes('vmConnectionPending'));
  assert.equal(elements(pending).some(element => element.props?.href), false);
});

test('embedded connections keep the network view to one card and reuse only the server VNC URL', () => {
  const h = panelHarness();
  const vncUrl = 'http://console.invalid/vnc_lite.html?path=vmi/example/vnc';
  h.panel.props = { ...h.panel.props, section: 'network', includeConnections: true,
    vmProfile: { network: {}, connections: { vnc_url: vncUrl }, asset: { reference_count: 2 } } };
  const combined = h.panel.render();
  assert.equal(elements(combined).filter(element => element.type === 'Card').length, 1);
  assert.equal(elements(combined).find(element => element.type === 'Button' && element.props.href).props.href, vncUrl);
  assert.ok(textNodes(combined).includes('componentOverview.body.tab.overview.vmAssetReferences'));
  assert.ok(textNodes(combined).includes('2'));
  h.panel.props = { ...h.panel.props, vmProfile: { network: {}, connections: {}, asset: {} } };
  const pending = h.panel.render();
  assert.equal(elements(pending).filter(element => element.type === 'Card').length, 1);
  assert.equal(elements(pending).some(element => element.props?.href), false);
  assert.ok(textNodes(pending).includes('vmConnectionPending'));

  // The opt-in is for the standalone network region. Legacy/default profiles
  // and the console region keep their original distinct connection card.
  h.panel.props = { ...h.panel.props, section: undefined,
    vmProfile: { network: {}, connections: { vnc_url: vncUrl }, asset: {} } };
  const whole = h.panel.render();
  assert.equal(elements(whole).filter(element => element.type === 'Card').length, 5);
  assert.equal(elements(whole).filter(element => element.props?.href === vncUrl).length, 1);
  h.panel.props = { ...h.panel.props, section: 'connections' };
  const console = h.panel.render();
  assert.equal(elements(console).filter(element => element.type === 'Card').length, 1);
  assert.equal(elements(console).filter(element => element.props?.href === vncUrl).length, 1);
});

test('an explicit unavailable connection message hides a stale VNC URL without changing normal fallback behavior', () => {
  const h = panelHarness();
  const vncUrl = 'http://console.invalid/vnc_lite.html?path=vmi/example/vnc';
  const message = 'Virtual machine is stopped. Start it before connecting to the console.';
  for (const section of ['network', 'connections']) {
    h.panel.props = { ...h.panel.props, section, includeConnections: true,
      connectionUnavailableMessage: message,
      vmProfile: { network: {}, connections: { vnc_url: vncUrl }, asset: { reference_count: 2 } } };
    const view = h.panel.render();
    assert.ok(textNodes(view).includes(message));
    assert.equal(elements(view).some(element => element.props?.href), false);
    assert.equal(textNodes(view).includes('vmConnectionPending'), false);
  }
  h.panel.props = { ...h.panel.props, section: 'connections', connectionUnavailableMessage: undefined };
  assert.equal(elements(h.panel.render()).find(element => element.props?.href).props.href, vncUrl);
  h.panel.props = { ...h.panel.props, vmProfile: { connections: {}, network: {}, asset: {} } };
  assert.ok(textNodes(h.panel.render()).includes('vmConnectionPending'));
  h.panel.props = { ...h.panel.props, section: undefined };
  assert.equal(elements(h.panel.render()).filter(element => element.type === 'Card').length, 5);
});

test('leaving network sections invalidates a pending address read, and returning starts a fresh read', async () => {
  const h = panelHarness();
  let resolvePorts;
  h.api.ports = () => new Promise(resolve => { resolvePorts = resolve; });
  const oldRead = h.panel.fetchClusterIP();
  const previous = h.panel.props;
  h.panel.props = { ...previous, section: 'acceleration' };
  h.panel.componentDidUpdate(previous);
  resolvePorts(okPorts);
  await oldRead;
  assert.equal(h.calls.filter(call => call.method === 'service').length, 0);
  let freshReads = 0;
  h.panel.fetchClusterIP = () => { freshReads += 1; };
  const acceleration = h.panel.props;
  h.panel.props = { ...acceleration, section: 'network' };
  h.panel.componentDidUpdate(acceleration);
  assert.equal(freshReads, 1);
});

test('every absent-address state keeps the internal-address row and real configuration action', () => {
  const h = panelHarness();
  for (const [status, suffix] of [
    ['loading', 'vmNetworkLoading'], ['no-inner-ports', 'vmNetworkNoInnerPorts'],
    ['service-pending', 'vmNetworkServicePending'], ['read-failed', 'vmNetworkReadFailed']
  ]) {
    h.panel.state = { ...h.panel.state, clusterIP: '', networkStatus: status };
    const text = textNodes(h.panel.renderInternalAddress());
    assert.ok(text.includes('componentOverview.body.tab.overview.vmClusterIP'));
    assert.ok(text.includes(`componentOverview.body.tab.overview.${suffix}`));
    assert.ok(text.includes('componentOverview.body.tab.overview.vmNetworkConfigurePorts'));
  }
  h.panel.state = { ...h.panel.state, clusterIP: '10.43.12.9', networkStatus: 'ready' };
  assert.ok(textNodes(h.panel.renderInternalAddress()).includes('10.43.12.9'));
});

test('configure navigates to the current component port page without any service mutation', () => {
  const h = panelHarness();
  h.panel.handleConfigurePorts();
  assert.deepEqual(JSON.parse(JSON.stringify(h.actions)), [{
    type: 'navigate',
    target: '/team/team-a/region/region-a/apps/868/overview?type=components&componentID=vm-a&tab=port&refresh=read-1'
  }]);
  assert.equal(h.calls.length, 0);
});
