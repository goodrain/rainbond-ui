const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const babel = require('@umijs/deps/compiled/babel/core');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '../../..');
const scope = { tab: 'overview', subTab: '', alias: 'gr-real', team: 'team', region: 'region', application: '868' };
const globalUtil = {
  getSlidePanelTab: () => scope.tab, getSlidePanelSubTab: () => scope.subTab,
  getSlidePanelComponentID: () => scope.alias, getCurrTeamName: () => scope.team,
  getCurrRegionName: () => scope.region, getAppID: () => scope.application, getRefresh: () => ''
};
const marker = name => {
  const Component = props => React.createElement('div', { 'data-module': name }, props.children);
  Component.displayName = name;
  return Component;
};
const modules = Object.fromEntries(['Overview', 'Expansion', 'Mnt', 'Port', 'AdvancedSettings', 'Setting', 'Log', 'EnvironmentConfiguration', 'Relation', 'ComponentPlugin', 'VMProfilePanel', 'GenericMonitor', 'VmWorkspace', 'PageHeader']
  .map(name => [name, marker(name)]));
const Form = marker('Form');
Form.create = () => Component => Component;
Form.Item = marker('FormItem');
const Tabs = marker('Tabs');
Tabs.TabPane = marker('TabPane');
const generic = marker('UI');
const antd = new Proxy({
  Form, Tabs,
  Card: ({ title, children, extra }) => React.createElement('section', { 'data-card': true }, title, extra, children),
  Descriptions: Object.assign(marker('Descriptions'), { Item: ({ label, children }) => React.createElement('div', { 'data-label': label }, children) }),
  Badge: ({ text }) => React.createElement('span', null, text),
  Button: ({ children, onClick }) => React.createElement('button', { onClick }, children),
  Empty: ({ description }) => React.createElement('div', { 'data-empty': true }, description),
  Alert: ({ message }) => React.createElement('div', { role: 'alert' }, message),
  notification: { success() {}, warning() {} }
}, { get: (target, key) => target[key] || Object.assign(generic, { Group: generic, Option: generic, Item: generic }) });
const formatMessage = ({ id }) => id;
const context = React.createContext({});

function load(relative, dependencies = {}, suffix = '') {
  const filename = path.join(root, relative);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
      [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
  }).code;
  const exports = {};
  vm.runInNewContext(`${code}\n${suffix}`, { exports,
    window: { sessionStorage: { setItem() {} } },
    require: name => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      if (name === 'react') return React;
      if (name === 'antd') return antd;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'dva/router') return { Link: generic, routerRedux: { push: value => ({ type: 'router/push', value }), replace: value => ({ type: 'router/replace', value }) } };
      if (name === '@/utils/intl') return { formatMessage };
      if (name === 'umi') return { FormattedMessage: ({ id }) => React.createElement('span', null, id) };
      if (name.endsWith('.less')) return {};
      if (name.includes('vmComponentWorkspaceTabs')) return require('./vmComponentWorkspaceTabs');
      if (name.includes('componentPluginHelpers')) return require('./componentPluginHelpers');
      if (name.includes('componentPolling')) return require('./componentPolling');
      if (name.includes('componentViewPerformance')) return require('../../components/SlidePanel/components/componentViewPerformance');
      if (name.includes('pluginArchUtils')) return require('../../utils/pluginArchUtils');
      if (name.includes('vmProfileRefreshHelpers')) return require('./vmProfileRefreshHelpers');
      if (name.includes('vmComponentWorkspaceData')) return require('./vmComponentWorkspaceData');
      if (name.endsWith('/global')) return globalUtil;
      if (name.endsWith('/pulginUtils')) return { segregatePluginsByHierarchy: list => list || [] };
      if (name.endsWith('/funContext')) return { ResumeContext: context };
      if (name.endsWith('/expansionHelpers')) return { canShowExpansionTab: () => true };
      if (name.endsWith('/componentAbnormalGuide')) return { shouldShowComponentAbnormalGuide: () => false };
      if (name.endsWith('/agentVisibility')) return { isRainbondInfoAgentEnabled: () => false };
      if (name.endsWith('/agentGuideSession')) return { canShowComponentGuide: () => false };
      if (name === 'prop-types') return require('prop-types');
      return generic;
    }
  }, { filename });
  return exports;
}

const presenterDependencies = {
  './expansion': modules.Expansion, './mnt': modules.Mnt, './port': modules.Port,
  './setting': modules.Setting, './log': modules.Log,
  './environmentConfiguration': modules.EnvironmentConfiguration, './relation': modules.Relation,
  './componentPlugin': modules.ComponentPlugin, './overview': modules.Overview,
  './component/Basic/VMProfilePanel': modules.VMProfilePanel
};
const Presenter = load('src/pages/Component/VmComponentWorkspace.js', presenterDependencies).VmComponentWorkspace;
const mainDependencies = {
  '../../../pages/Component/VmComponentWorkspace': modules.VmWorkspace,
  '../../../pages/Component/overview': modules.Overview,
  '../../../pages/Component/expansion': modules.Expansion,
  '../../../pages/Component/advancedSettings': modules.AdvancedSettings,
  '../../../pages/Component/port': modules.Port,
  '../../../pages/Component/log': modules.Log,
  '../../../pages/Component/monitor': modules.GenericMonitor,
  '../../../pages/Component/environmentConfiguration': modules.EnvironmentConfiguration,
  '../../../pages/Component/relation': modules.Relation,
  '../../../pages/Component/componentPlugin': modules.ComponentPlugin,
  '../../ComponentPageHeader': modules.PageHeader,
  'react-transition-group': { TransitionGroup: generic, CSSTransition: generic }
};
const Main = load('src/components/SlidePanel/components/components.js', mainDependencies, 'exports.TestMain = Main;').TestMain;
const permissions = { isTelescopic: true, isStorage: true, isPort: true, isEnv: true, isRely: true, isOtherSetting: true, isServiceMonitor: true };
const realDetail = { service: { service_alias: 'gr-real', service_cname: 'Real VM', extend_method: 'vm', service_source: 'vm', min_cpu: 2000, min_memory: 2048, disk_cap: 30, arch: 'amd64' },
  vm_profile: { runtime_status: 'running', asset: { os_name: 'CirrOS' }, connections: { vnc_url: 'https://console.example.invalid/real' } } };
function treeElements(node) {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(treeElements)];
}
function main(tab = 'overview', method = 'vm') {
  scope.tab = tab;
  const actions = [];
  const instance = new Main({ appDetail: { ...realDetail, service: { ...realDetail.service, extend_method: method } },
    permissions, pluginList: [{ name: 'rainbond-vm' }], form: { getFieldDecorator: () => element => element }, dispatch: action => actions.push(action) });
  instance.state = { ...instance.state, routerSwitch: false, activeTab: tab, tabsShow: true, status: { status: 'closed' }, pageVisible: true };
  instance.fetchParameter = () => ({ team_name: 'team', region_name: 'region', app_alias: 'gr-real', service_cname: 'Real VM', group_id: '868' });
  instance.fetchPrefixUrl = () => '/team/team/region/region/';
  instance.checkPermissions = () => React.createElement('span', null, 'original-real-actions');
  instance.renderTitle = name => name;
  instance.getAbnormalGuideContext = () => ({});
  instance.setState = (update, callback) => {
    instance.state = { ...instance.state, ...(typeof update === 'function' ? update(instance.state) : update) };
    if (callback) callback();
  };
  return { instance, actions };
}
function presenter(tab = 'overview', extra = {}) {
  scope.tab = tab;
  return new Presenter({ appAlias: 'gr-real', teamName: 'team', regionName: 'region', vmWorkspaceTab: tab,
    appDetail: realDetail, status: { status: 'closed' }, permissions, componentPermissions: permissions,
    vmWorkspacePlugins: [{ name: 'rainbond-vm' }], dispatch() {}, ...extra });
}

test('VM Main renders six dedicated tabs and the real workspace while non-VM modules remain unchanged', () => {
  const vmMain = main();
  const nodes = treeElements(vmMain.instance.render());
  const header = nodes.find(node => node.type === modules.PageHeader);
  assert.deepEqual(Array.from(header.props.tabList, tab => tab.key), ['overview', 'expansion', 'port', 'snapshots', 'advancedSettings', 'rainbond-vm']);
  assert.ok(nodes.some(node => node.type === modules.VmWorkspace));
  assert.equal(header.props.action.props.children, 'original-real-actions');
  const container = main('monitor', 'stateless');
  const containerNodes = treeElements(container.instance.render());
  assert.ok(containerNodes.some(node => node.type === modules.GenericMonitor));
  assert.equal(containerNodes.some(node => node.type === modules.VmWorkspace), false);
  assert.ok(treeElements(main('log', 'stateless').instance.render()).some(node => node.type === modules.Log));
});

test('legacy VM advanced port URLs resolve to Network while non-VM advanced URLs remain unchanged', () => {
  const { instance } = main();
  for (const [input, expected] of [['hardware', 'expansion'], ['network', 'port'], ['snapshot', 'snapshots'], ['console', 'overview'], ['monitor', 'rainbond-vm'], ['log', 'advancedSettings'], ['environmentConfiguration', 'advancedSettings'], ['relation', 'advancedSettings']])
    assert.equal(instance.normalizeActiveTab(input, realDetail), expected);
  assert.equal(instance.normalizeActiveTab('advancedSettings', realDetail), 'advancedSettings');
  scope.subTab = 'port';
  assert.equal(instance.normalizeActiveTab('advancedSettings', realDetail), 'port');
  assert.equal(instance.normalizeActiveTab('advanced', realDetail), 'port');
  assert.equal(instance.normalizeActiveTab('advancedSettings', { service: { extend_method: 'stateless' } }), 'advancedSettings');
  const nodes = treeElements(presenter('advancedSettings').render());
  assert.ok(nodes.some(node => node.type === modules.Port));
  assert.equal(nodes.some(node => node.type === modules.AdvancedSettings), false);
  scope.subTab = '';
});

test('legacy VM advanced storage URLs resolve to Hardware while container storage stays in Advanced', () => {
  const { instance } = main();
  scope.subTab = 'mnt';
  assert.equal(instance.normalizeActiveTab('advancedSettings', realDetail), 'expansion');
  assert.equal(instance.normalizeActiveTab('advanced', realDetail), 'expansion');
  assert.equal(instance.normalizeActiveTab('advancedSettings', { service: { extend_method: 'stateless' } }), 'advancedSettings');
  const nodes = treeElements(presenter('advancedSettings').render());
  assert.ok(nodes.some(node => node.type === modules.Mnt));
  assert.equal(nodes.some(node => node.type === Tabs), false);
  scope.subTab = '';
});

test('changing only an old advanced subTab redirects the VM to its dedicated page', () => {
  for (const [subTab, expected] of [['port', 'port'], ['mnt', 'expansion']]) {
    const h = main('advancedSettings');
    h.instance.getPollingIdentity = () => 'unchanged-component';
    h.instance.pollingIdentity = 'unchanged-component';
    h.instance.props = { ...h.instance.props, location: { search: `?tab=advancedSettings&subTab=${subTab}` } };
    scope.subTab = subTab;
    h.instance.componentDidUpdate({ location: { search: '?tab=advancedSettings&subTab=log' } });
    assert.equal(h.actions.length, 1);
    const target = new URL(h.actions[0].value, 'http://localhost');
    assert.equal(target.searchParams.get('tab'), expected);
    assert.equal(target.searchParams.has('subTab'), false);
  }
  scope.subTab = '';
});

test('entering VM Advanced discards old port or storage subTabs while containers retain them', () => {
  for (const legacySubTab of ['port', 'mnt']) {
    for (const method of ['vm', 'stateless']) {
      const h = main('port', method);
      scope.subTab = legacySubTab;
      h.instance.handleTabChange('advancedSettings');
      const target = new URL(h.actions[0].value, 'http://localhost');
      assert.equal(target.searchParams.get('tab'), 'advancedSettings');
      assert.equal(target.searchParams.get('subTab'), method === 'vm' ? 'log' : legacySubTab);
    }
  }
  scope.subTab = '';
});

test('Main rewrites legacy VM log/configuration/dependency URLs with their original advanced destination', () => {
  for (const legacyTab of ['log', 'environmentConfiguration', 'relation']) {
    const h = main('overview');
    h.instance.getPollingIdentity = () => 'unchanged-component';
    h.instance.pollingIdentity = 'unchanged-component';
    h.instance.props = { ...h.instance.props, location: { search: `?tab=${legacyTab}` } };
    scope.tab = legacyTab;
    h.instance.componentDidUpdate({ location: { search: '?tab=overview' } });
    assert.equal(h.actions.length, 1);
    const target = new URL(h.actions[0].value, 'http://localhost');
    assert.equal(target.searchParams.get('tab'), 'advancedSettings');
    assert.equal(target.searchParams.get('subTab'), legacyTab);
    assert.equal(target.searchParams.get('componentID'), 'gr-real');
  }
});

test('workspace modules retain real hardware, disks, ports, overview VNC and VM plugin components', () => {
  let nodes = treeElements(presenter('expansion').render());
  assert.equal(nodes.some(node => node.type === modules.Expansion), false, 'the full scaling editor is not mounted in the default hardware view');
  assert.ok(nodes.some(node => node.type === modules.Mnt));
  assert.ok(nodes.some(node => node.type === modules.VMProfilePanel && node.props.section === 'acceleration'));
  nodes = treeElements(presenter('port').render());
  assert.ok(nodes.some(node => node.type === modules.Port));
  assert.ok(nodes.some(node => node.type === modules.VMProfilePanel && node.props.section === 'network'));
  nodes = treeElements(presenter('console').render());
  assert.ok(nodes.some(node => node.type === modules.VMProfilePanel && node.props.section === 'network' && node.props.includeConnections));
  assert.ok(nodes.some(node => node.type === modules.Overview && node.props.section === 'operations'));
  nodes = treeElements(presenter('rainbond-vm').render());
  assert.ok(nodes.some(node => node.type === modules.ComponentPlugin && node.props.type === 'rainbond-vm'));
  assert.equal(nodes.some(node => node.type === modules.GenericMonitor), false);
  const missing = treeElements(presenter('rainbond-vm', { vmWorkspacePlugins: [] }).render());
  assert.ok(missing.some(node => node.type === antd.Empty));
});

test('hardware shows actual compact resources and opens the original VM editor only through the permitted Edit action', () => {
  const actions = [];
  const restartTips = () => {};
  const view = presenter('expansion', { dispatch: action => actions.push(action), onshowRestartTips: restartTips });
  view.setState = update => { view.state = { ...view.state, ...update }; };
  let nodes = treeElements(view.render());
  const compute = nodes.find(node => node.type === antd.Card && node.props.title === 'componentOverview.vmWorkspace.computeTitle');
  assert.ok(compute);
  assert.ok(ReactDOMServer.renderToStaticMarkup(compute).includes('2 GiB'));
  assert.ok(ReactDOMServer.renderToStaticMarkup(compute).includes('2 componentOverview.vmWorkspace.cores'));
  assert.equal(nodes.some(node => node.type === modules.Expansion), false);
  compute.props.extra.props.onClick();
  nodes = treeElements(view.render());
  const editor = nodes.find(node => node.type === modules.Expansion);
  assert.ok(editor);
  assert.equal(editor.props.vmWorkspaceEditor, true);
  assert.equal(editor.props.vmWorkspaceEditorActive, true);
  assert.equal(editor.props.method, 'vm');
  assert.equal(editor.props.onshowRestartTips, restartTips);
  assert.equal(editor.props.componentPermissions, permissions);
  editor.props.onCancelVmWorkspaceEditor();
  assert.equal(treeElements(view.render()).some(node => node.type === modules.Expansion), false);
  const denied = presenter('expansion', { componentPermissions: {} });
  const deniedCompute = treeElements(denied.render()).find(node => node.type === antd.Card && node.props.title === 'componentOverview.vmWorkspace.computeTitle');
  assert.equal(deniedCompute.props.extra, null);
  assert.equal(treeElements(denied.render()).some(node => node.type === modules.Expansion), false);
  assert.deepEqual(actions, []);
});

test('the original resource-save success hook refreshes scoped detail once while Cancel performs no request', async () => {
  const actions = [];
  const view = presenter('expansion', { dispatch: action => actions.push(action) });
  view.setState = update => { view.state = { ...view.state, ...update }; };
  view.componentDidMount();
  view.openHardwareEditor();
  let editor = treeElements(view.render()).find(node => node.type === modules.Expansion);
  editor.props.onCancelVmWorkspaceEditor();
  assert.deepEqual(actions, []);
  view.openHardwareEditor();
  editor = treeElements(view.render()).find(node => node.type === modules.Expansion);
  const refreshed = editor.props.onVmWorkspaceResourceSaved();
  assert.equal(actions.length, 1);
  assert.equal(actions[0].type, 'appControl/fetchDetail');
  assert.equal(actions[0].shouldApply(), true);
  actions[0].callback(realDetail);
  await refreshed;
  assert.equal(view.state.refreshing, false);
  assert.equal(actions.some(action => /putStart|putStop|putReStart|newVertical|vmDemo/.test(action.type)), false);
});

test('stopped and undeployed VMs mark the real console unavailable even when the profile has a stale URL', () => {
  const actions = [];
  for (const state of ['closed', 'stopped', 'undeploy']) {
    for (const tab of ['overview', 'console']) {
      const nodes = treeElements(presenter(tab, { status: { status: state }, dispatch: action => actions.push(action) }).render());
      const connection = nodes.find(node => node.type === modules.VMProfilePanel && node.props.section === 'network' && node.props.includeConnections);
      assert.ok(connection);
      assert.equal(connection.props.connectionUnavailableMessage, 'componentOverview.vmWorkspace.consoleStopped');
    }
  }
  for (const state of ['running', 'unknown']) {
    const view = presenter('console', { status: { status: state }, appDetail: {
      ...realDetail, vm_profile: { ...realDetail.vm_profile, connections: {} }
    }, dispatch: action => actions.push(action) });
    const connection = treeElements(view.render()).find(node => node.type === modules.VMProfilePanel && node.props.section === 'network' && node.props.includeConnections);
    assert.equal(connection.props.connectionUnavailableMessage, undefined);
  }
  assert.deepEqual(actions, []);
});

test('advanced retains real logs, configuration and dependencies with their original permissions', () => {
  for (const [key, Component] of [['log', modules.Log], ['environmentConfiguration', modules.EnvironmentConfiguration], ['relation', modules.Relation], ['setting', modules.Setting]]) {
    scope.subTab = key;
    const nodes = treeElements(presenter('advancedSettings').render());
    assert.ok(nodes.some(node => node.type === Component));
    const tabs = nodes.find(node => node.type === Tabs);
    assert.deepEqual(Array.from(tabs.props.children, node => node.key), ['log', 'environmentConfiguration', 'relation', 'setting']);
    assert.equal(nodes.some(node => [modules.AdvancedSettings, modules.Port, modules.Mnt].includes(node.type)), false);
  }
  scope.subTab = '';
  const nodes = treeElements(presenter('advancedSettings', { permissions: {}, componentPermissions: {} }).render());
  assert.ok(nodes.some(node => node.type === modules.Log));
  assert.equal(nodes.some(node => node.type === modules.EnvironmentConfiguration || node.type === modules.Relation || node.type === modules.AdvancedSettings), false);
});

test('a port-only role retains Network and has no storage or other-settings content in Advanced', () => {
  const extra = { permissions: { isPort: true }, componentPermissions: { isPort: true } };
  scope.subTab = 'setting';
  const advanced = treeElements(presenter('advancedSettings', extra).render());
  assert.ok(advanced.some(node => node.type === modules.Log));
  assert.equal(advanced.some(node => [modules.Mnt, modules.Setting, modules.Port].includes(node.type)), false);
  scope.subTab = '';
  assert.ok(treeElements(presenter('port', extra).render()).some(node => node.type === modules.Port));
});

test('overview has two state/connection cards, live resources and original operation records without fake success', () => {
  const actions = [];
  const view = presenter('overview', { dispatch: action => actions.push(action) });
  const html = ReactDOMServer.renderToStaticMarkup(view.render());
  assert.ok(html.includes('power.closed'));
  assert.ok(html.includes('CirrOS'));
  assert.ok(html.includes('30 GiB'));
  assert.ok(html.includes('guestNotReported'));
  assert.equal(html.includes('10.43.0.41'), false);
  assert.equal(html.includes('power.running'), false);
  const overviewNodes = treeElements(view.render());
  assert.equal(overviewNodes.filter(node => node.type === modules.VMProfilePanel && node.props.section === 'connections').length, 0);
  assert.equal(overviewNodes.filter(node => node.type === modules.VMProfilePanel && node.props.section === 'network' && node.props.includeConnections).length, 1);
  assert.ok(overviewNodes.some(node => node.type === modules.Overview && node.props.section === 'operations'));
  const snapshots = ReactDOMServer.renderToStaticMarkup(presenter('snapshots', { dispatch: action => actions.push(action) }).render());
  const dom = new JSDOM(snapshots);
  assert.ok(snapshots.includes('snapshotNotConnected'));
  assert.equal(dom.window.document.querySelectorAll('button').length, 0);
  dom.window.close();
  assert.deepEqual(actions, []);
});

test('the real detail refresh passes a scope and generation guard to the shared model', async () => {
  const actions = [];
  const instance = presenter('overview', { dispatch: action => actions.push(action) });
  instance.setState = update => { instance.state = { ...instance.state, ...update }; };
  instance.componentDidMount();
  const request = instance.refreshProfile();
  assert.equal(actions.length, 1);
  assert.equal(actions[0].type, 'appControl/fetchDetail');
  assert.equal(actions[0].shouldApply(), true);
  scope.alias = 'gr-other';
  assert.equal(actions[0].shouldApply(), false);
  scope.alias = 'gr-real';
  instance.componentWillUnmount();
  assert.equal(actions[0].shouldApply(), false);
  actions[0].callback(realDetail);
  await request;
  assert.equal(instance.state.refreshing, true, 'a stale callback cannot update the old workspace');
});

test('the connected workspace retains Main getWrappedInstance and real action-log callbacks', () => {
  const dom = new JSDOM('<!doctype html><div id="mount"></div>', { url: 'http://localhost/' });
  const names = ['window', 'document', 'navigator', 'MessageChannel', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const previous = Object.fromEntries(names.map(name => [name, Object.getOwnPropertyDescriptor(global, name)]));
  const globals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, MessageChannel: undefined,
    requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout };
  Object.entries(globals).forEach(([name, value]) => Object.defineProperty(global, name, { configurable: true, writable: true, value }));
  dom.window.requestAnimationFrame = globals.requestAnimationFrame;
  dom.window.cancelAnimationFrame = clearTimeout;
  const ReactDOM = require('react-dom');
  const { act } = require('react-dom/test-utils');
  const { Provider } = require(require.resolve('react-redux', { paths: [require.resolve('dva')] }));
  const { createStore } = require('redux');
  const forwarded = [];
  class Records extends React.Component {
    onAction = value => forwarded.push(value);
    getWrappedInstance = () => this;
    render() { return null; }
  }
  const Connected = load('src/pages/Component/VmComponentWorkspace.js', {
    ...presenterDependencies, './overview': Records, dva: require('dva')
  }).default;
  let ref;
  try {
    scope.tab = 'overview';
    act(() => { ReactDOM.render(React.createElement(Provider, { store: createStore(() => ({})) }, React.createElement(Connected, {
      ref: value => { ref = value; }, appAlias: 'gr-real', teamName: 'team', regionName: 'region', appDetail: realDetail,
      status: { status: 'closed' }, vmWorkspaceTab: 'overview', dispatch() {}, componentPermissions: permissions, permissions
    })), document.getElementById('mount')); });
    assert.equal(typeof ref.getWrappedInstance, 'function');
    const host = main();
    host.instance.handleOffHelpfulHints = () => {};
    host.instance.saveRef(ref);
    host.instance.handleOperation('putStart');
    assert.equal(host.actions[0].type, 'appControl/putStart');
    host.actions[0].callback({ bean: { event_id: 'actual-action-event' } });
    assert.equal(forwarded.length, 1);
    assert.equal(forwarded[0].event_id, 'actual-action-event');
  } finally {
    act(() => { ReactDOM.unmountComponentAtNode(document.getElementById('mount')); });
    dom.window.close();
    Object.entries(previous).forEach(([name, descriptor]) => {
      if (descriptor) Object.defineProperty(global, name, descriptor); else delete global[name];
    });
  }
});
