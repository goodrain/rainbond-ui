/* Production parent conditionals + real DVA Provider/ReactDOM/UMI dynamic.
 * Chunk transport and unrelated visuals are controlled, with no backend writes. */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const babel = require('@umijs/deps/compiled/babel/core');

const repo = path.resolve(__dirname, '../../..');
const targets = {
  drawer: 'src/components/SlidePanel/index.js',
  header: 'src/components/SlidePanel/components/app.js',
  deferred: 'src/components/DeferredComponent/index.js'
};
const compiled = Object.fromEntries(Object.entries(targets).map(([name, relative]) => [name,
  babel.transformSync(fs.readFileSync(path.join(repo, relative), 'utf8'), {
    filename: path.join(repo, relative), babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [({ types }) => ({ visitor: { CallExpression(nodePath) {
      if (nodePath.node.callee.type === 'Import') nodePath.replaceWith(types.callExpression(
        types.identifier('__loadChunk'), nodePath.node.arguments));
    } } }), [require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
  }).code
]));

async function withParents(verify) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://127.0.0.1/', pretendToBeVisual: true
  });
  const globals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window), MessageChannel: undefined,
    requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout };
  const previous = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  Object.entries(globals).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
  dom.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  let ReactDOM;
  try {
    const React = require('react'); ReactDOM = require('react-dom');
    const dva = require('dva');
    const reduxProvider = require(require.resolve('react-redux', { paths: [require.resolve('dva')] }));
    assert.equal(dva.connect, reduxProvider.connect);
    assert.equal(require('umi').dynamic, require('@umijs/runtime').dynamic);
    const { createStore, applyMiddleware } = require('redux');
    const chunks = [], mounts = [], actions = [], instances = {}, parentClose = [];
    const route = { app: '35', component: 'component-old', team: 'team-a', region: 'region-a' };
    const componentPermissions = { isEdit: false, isCreate: true };
    const appPermissions = {};
    const permissions = { componentPermissions, appPermissions };
    const initialState = { user: { currentUser: { user_id: 'user-a' } },
      application: { apps: [], groupDetail: {} },
      teamControl: { currentTeamPermissionsInfo: { team: { fixture: true } }, currentTeam: {}, currentRegionName: route.region, pluginsList: [] },
      enterprise: { currentEnterprise: { enterprise_id: 'enterprise-a' } },
      loading: { effects: {} }, global: { rainbondInfo: {}, novices: {}, groups: [] } };
    let onNavigate;
    const store = createStore((state = initialState, action) => action.type === 'fixture/patch' ? { ...state, ...action.payload } : state,
      applyMiddleware(() => next => action => {
        actions.push(action); next(action);
        if (action.type === 'router/push' && onNavigate) onNavigate(action.payload);
        return Promise.resolve();
      }));
    const box = () => null;
    box.Item = box.Group = box.SubMenu = box;
    const pass = props => React.createElement(React.Fragment, null, props.children);
    const button = props => React.createElement('button', { onClick: props.onClick, disabled: props.disabled }, props.children);
    const observeConnect = (...args) => Component => {
      const original = Component.prototype.componentDidMount;
      Component.prototype.componentDidMount = function observeMount() {
        instances[Component.name] = this;
        return original && original.call(this);
      };
      return dva.connect(...args)(Component);
    };
    const util = { getAppID: () => route.app, getSlidePanelComponentID: () => route.component,
      getCurrTeamName: () => route.team, getCurrRegionName: () => route.region };
    const fixtures = { react: React, dva: { ...dva, connect: observeConnect },
      'dva/router': { routerRedux: { push: payload => ({ type: 'router/push', payload }) } },
      umi: { FormattedMessage: props => React.createElement('span', null, props.id) },
      antd: new Proxy({}, { get: (object, key) => key === 'Button' ? button
        : key === 'Row' || key === 'Col' || key === 'Tag' || key === 'Tooltip' || key === 'Badge' ? pass
          : key === 'notification' ? { warning() {}, success() {} } : box }),
      '@/utils/global': util,
      '@/utils/intl': { formatMessage: value => value.id },
      '@/utils/pageHeaderSvg': { getSvg: () => null },
      '@/utils/newRole': { queryPermissionsInfo: (...args) => ({ source: args[1], app: args[2] }) },
      './componentViewPerformance': { shouldLoadStorageUsage: () => false },
      moment: require('moment') };
    const loadChunk = name => {
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      const record = { name, promise, reject, resolve: () => resolve({ __esModule: true, default: props => {
        mounts.push({ name, props }); return React.createElement('div', { 'data-chunk': name }, props.componentID || props.groupId || 'loaded');
      } }) };
      chunks.push(record); return promise;
    };
    const evaluate = (name, extra = {}) => {
      const module = { exports: {} };
      new Function('module', 'exports', 'require', '__loadChunk', compiled[name])(module, module.exports, id => {
        if (Object.prototype.hasOwnProperty.call(extra, id)) return extra[id];
        if (Object.prototype.hasOwnProperty.call(fixtures, id)) return fixtures[id];
        if (/\.less$/.test(id)) return {};
        return box;
      }, loadChunk);
      return module.exports.default;
    };
    const deferred = evaluate('deferred', { umi: require('umi'), antd: require('antd') });
    const Drawer = evaluate('drawer', { '../DeferredComponent': deferred });
    const Header = evaluate('header', { '../../DeferredComponent': deferred });
    const container = dom.window.document.getElementById('root');
    let showDrawer = false, showHeader = false, drawerProps = {}, headerProps = {};
    const mount = (changes = {}) => {
      if ('showDrawer' in changes) showDrawer = changes.showDrawer;
      if ('showHeader' in changes) showHeader = changes.showHeader;
      drawerProps = { ...drawerProps, ...(changes.drawerProps || {}) };
      headerProps = { ...headerProps, ...(changes.headerProps || {}) };
      const header = { permissions, initialDetailLoader() {}, initialDetailScope: 'scope-a', pluginsList: [],
        applicationRoute: { teamName: route.team, regionName: route.region, appID: route.app },
        handleAddComponentOrAppDetail: value => parentClose.push(value), ...headerProps };
      ReactDOM.render(React.createElement(reduxProvider.Provider, { store }, React.createElement(React.Fragment, null,
        showDrawer && React.createElement(Drawer, { isVisible: false, type: 'components', ...drawerProps }),
        showHeader && React.createElement(Header, { key: route.app, ...header }))), container);
    };
    const flush = () => new Promise(resolve => setTimeout(resolve, 15));
    await verify({ React, container, dom, chunks, mounts, actions, instances, route, store, permissions, parentClose, mount, flush,
      onNavigate: callback => { onNavigate = callback; },
      unmount: () => ReactDOM.unmountComponentAtNode(container) });
  } finally {
    if (ReactDOM) ReactDOM.unmountComponentAtNode(dom.window.document.getElementById('root'));
    await new Promise(resolve => setTimeout(resolve, 20)); dom.window.close();
    Object.entries(previous).forEach(([key, descriptor]) => {
      if (descriptor) Object.defineProperty(global, key, descriptor); else delete global[key];
    });
  }
}

test('closed drawer and both closed creation paths issue no chunk imports', () => withParents(async h => {
  h.mount({ showDrawer: true, showHeader: true }); await h.flush();
  assert.deepEqual(h.chunks, []); assert.deepEqual(h.mounts, []);
  assert.equal(h.actions.filter(action => action.type === 'application/fetchGroupDetail').length, 1,
    'existing header initialization remains present');
}));

test('only selected component drawer imports, then receives latest ID/location and existing permissions', () => withParents(async h => {
  const initialLocation = { pathname: '/overview', search: '?component=old' };
  h.mount({ showDrawer: true, drawerProps: { isVisible: true, type: 'components', location: initialLocation } });
  await h.flush(); assert.deepEqual(h.chunks.map(chunk => chunk.name), ['./components/components']);
  assert.deepEqual(h.mounts, []);
  h.route.component = 'component-current'; const location = { pathname: '/overview', search: '?component=current' };
  h.mount({ drawerProps: { componentID: h.route.component, location } });
  // The existing permission-refresh isLoading branch unmounts the old drawer.
  // Its module may resolve later, but only the newly selected instance may mount.
  assert.deepEqual(h.chunks.map(chunk => chunk.name), ['./components/components', './components/components']);
  h.chunks[0].resolve(); await h.flush();
  assert.deepEqual(h.mounts, []);
  h.chunks[1].resolve(); await h.flush();
  assert.equal(h.mounts.length, 1); assert.equal(h.mounts[0].props.componentID, 'component-current');
  assert.equal(h.mounts[0].props.location, location);
  assert.equal(Object.prototype.hasOwnProperty.call(h.mounts[0].props, 'onLoadingCancel'), false);
  assert.deepEqual(h.mounts[0].props.permissions, { source: 'app_overview', app: 'app_35' });
}));

test('switching a pending component drawer to gateway cannot mount obsolete component content', () => withParents(async h => {
  h.mount({ showDrawer: true, drawerProps: { isVisible: true, type: 'components' } }); await h.flush();
  h.mount({ drawerProps: { type: 'gateway' } }); await h.flush();
  assert.deepEqual(h.chunks.map(chunk => chunk.name), ['./components/components', './components/gateway']);
  h.chunks[0].resolve(); await h.flush(); assert.deepEqual(h.mounts, []);
  h.chunks[1].resolve(); await h.flush(); assert.equal(h.mounts.length, 1);
  assert.equal(h.mounts[0].name, './components/gateway');
  assert.equal(Object.prototype.hasOwnProperty.call(h.mounts[0].props, 'onLoadingCancel'), false);
  assert.deepEqual(h.mounts[0].props.permissions, {
    routePermission: { source: 'team_route_manage', app: undefined },
    argetServicesPermission: { source: 'team_target_services', app: undefined },
    certificatePermission: { source: 'team_certificate', app: undefined }
  });
}));

test('closing a pending gateway drawer prevents late mounted content', () => withParents(async h => {
  h.mount({ showDrawer: true, drawerProps: { isVisible: true, type: 'gateway' } }); await h.flush();
  h.mount({ drawerProps: { isVisible: false } });
  h.chunks[0].resolve(); await h.flush();
  assert.equal(h.chunks.length, 1); assert.deepEqual(h.mounts, []);
}));

for (const type of ['components', 'gateway']) {
  for (const fail of [false, true]) {
    test(`${type} ${fail ? 'failed' : 'pending'} drawer can cancel using current route and existing topology message`, () => withParents(async h => {
      const messages = []; const iframe = h.dom.window.document.createElement('iframe'); iframe.id = 'myframe';
      h.dom.window.document.body.appendChild(iframe);
      iframe.contentWindow.postMessage = (...args) => messages.push(args);
      h.mount({ showDrawer: true, drawerProps: { isVisible: true, type } }); await h.flush();
      assert.equal(h.chunks.length, 1);
      if (fail) { h.chunks[0].reject(new Error('controlled-import-failure')); await h.flush(); }
      Object.assign(h.route, { app: '36', team: 'team-current', region: 'region-current' });
      h.onNavigate(() => h.mount({ drawerProps: { isVisible: false } }));
      const cancel = Array.from(h.container.querySelectorAll('button')).find(button => button.textContent === 'button.cancel');
      assert.ok(cancel, 'drawer loading and failure must retain a cancel control before its Header loads');
      cancel.dispatchEvent(new h.dom.window.MouseEvent('click', { bubbles: true })); await h.flush();
      assert.deepEqual(h.actions, [{ type: 'router/push', payload: '/team/team-current/region/region-current/apps/36/overview' }]);
      assert.deepEqual(messages, [[{ type: 'TRIGGER_CLICK_BACKGROUND' }, '*']]);
      if (!fail) h.chunks[0].resolve();
      await h.flush(); assert.deepEqual(h.mounts, []);
      assert.equal(h.container.querySelector('[role="status"], [role="alert"]'), null);
    }));
  }
}

test('legacy add panel imports only itself and preserves latest props, refresh callback and animated close', () => withParents(async h => {
  h.mount({ showHeader: true, headerProps: { addComponentOrAppDetail: 'addComponent' } }); await h.flush();
  assert.deepEqual(h.chunks.map(chunk => chunk.name), ['../../../pages/Group/AddServiceComponent']);
  const header = h.instances.app; const architecture = ['arm64'];
  header.setState({ currApp: { app_arch: architecture } });
  h.chunks[0].resolve(); await h.flush();
  const child = h.mounts.at(-1); assert.equal(child.props.groupId, '35'); assert.equal(child.props.archInfo, architecture);
  const reads = h.actions.filter(action => action.type === 'application/fetchGroupDetail').length;
  child.props.refreshCurrent();
  assert.equal(h.actions.filter(action => action.type === 'application/fetchGroupDetail').length, reads + 1);
  child.props.handleClose(); assert.deepEqual(h.parentClose, ['']);
  await new Promise(resolve => setTimeout(resolve, 420));
  assert.equal(header.state.addComponentOrAppDetail, '');
  assert.equal(h.container.querySelector('[data-chunk]'), null);
  assert.equal(h.actions.some(action => /createApp\//.test(action.type)), false);
}));

test('pending legacy add panel close finishes before a late module can mount', () => withParents(async h => {
  h.mount({ showHeader: true, headerProps: { addComponentOrAppDetail: 'addComponent' } }); await h.flush();
  h.instances.app.handleClose(); await new Promise(resolve => setTimeout(resolve, 420));
  h.chunks[0].resolve(); await h.flush();
  assert.deepEqual(h.mounts, []); assert.deepEqual(h.parentClose, ['']);
}));

test('new create Modal imports only when opened and forwards current DVA props/cancel without writes', () => withParents(async h => {
  h.mount({ showHeader: true }); h.instances.app.handleOpenAddComponentOrAppDetail('addComponent'); await h.flush();
  assert.deepEqual(h.chunks.map(chunk => chunk.name), ['../../CreateComponentModal']);
  const enterprise = { enterprise_id: 'enterprise-current' }, groups = [{ ID: 35 }];
  h.store.dispatch({ type: 'fixture/patch', payload: { enterprise: { currentEnterprise: enterprise },
    global: { rainbondInfo: { version: 'current' }, novices: {}, groups } } });
  h.chunks[0].resolve(); await h.flush();
  const child = h.mounts.at(-1);
  assert.equal(child.props.visible, true); assert.equal(child.props.currentEnterprise, enterprise);
  assert.equal(child.props.groups, groups); assert.equal(child.props.dispatch, h.store.dispatch);
  assert.equal(child.props.currentUser.user_id, 'user-a');
  child.props.onCancel(); await h.flush(); assert.equal(h.instances.app.state.showCreateComponentModal, false);
  assert.equal(h.container.querySelector('[data-chunk]'), null);
  assert.equal(h.actions.some(action => /createApp\//.test(action.type)), false);
}));

test('real loading Modal close cancels before import resolution without late mounts', () => withParents(async h => {
  h.mount({ showHeader: true }); h.instances.app.handleOpenAddComponentOrAppDetail('addComponent'); await h.flush();
  const close = h.dom.window.document.querySelector('[role="dialog"] button[aria-label="Close"]'); assert.ok(close);
  close.dispatchEvent(new h.dom.window.MouseEvent('click', { bubbles: true })); await h.flush();
  h.chunks[0].resolve(); await h.flush();
  assert.deepEqual(h.mounts, []); assert.equal(h.instances.app.state.showCreateComponentModal, false);
}));

test('leaving an app while creation code is pending cannot mount old app content', () => withParents(async h => {
  h.mount({ showHeader: true }); h.instances.app.handleOpenAddComponentOrAppDetail('addComponent'); await h.flush();
  const old = h.instances.app; h.route.app = '36'; h.mount(); await h.flush();
  assert.notEqual(h.instances.app, old); assert.equal(old.componentMounted, false);
  h.chunks[0].resolve(); await h.flush();
  assert.deepEqual(h.mounts, []); assert.equal(h.instances.app.state.showCreateComponentModal, false);
  assert.equal(h.actions.some(action => /createApp\//.test(action.type)), false);
}));
