/*
 * Connected local integration: production TeamLayout -> its actual layouts
 * AppHeader -> DVA-connected SelectApp -> real global generator/reducer -> real
 * team service. Only unrelated setup APIs, visual primitives and final request
 * transport are fixtures. This is not a deployed or full-application E2E test.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const { runSaga } = require('redux-saga');
const sagaEffects = require('redux-saga/effects');
const babel = require('@umijs/deps/compiled/babel/core');

const repo = path.resolve(__dirname, '../..');
const paths = { layout: 'src/layouts/TeamLayout.js', header: 'src/layouts/components/AppHeader.js',
  selector: 'src/components/SelectApp/index.js', global: 'src/models/global.js',
  service: 'src/services/team.js', utility: 'src/utils/global.js', context: 'src/layouts/MenuContext.js' };
const compiled = Object.fromEntries(Object.entries(paths).map(([name, relative]) => [name,
  babel.transformSync(fs.readFileSync(path.join(repo, relative), 'utf8'), {
    filename: path.join(repo, relative), babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
      [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
  }).code
]));

async function withGroups(verify, options = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1/' });
  const globals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    MessageChannel: undefined, requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout };
  Object.assign(dom.window, { requestAnimationFrame: globals.requestAnimationFrame, cancelAnimationFrame: clearTimeout });
  const previous = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  Object.entries(globals).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
  let ReactDOM, store, model, currentApp = '35', currentTeam = 'team-a', currentRegion = 'region-a';
  let route = options.route || 'overview', search = '', headerWanted = false, useLayout = true, standaloneHeader = false;
  let selectorProps = {}, latestCreateProps, latestSearchProps, queuedState = null, delayNextState = false;
  const requests = [], actions = [], saved = [], errors = [], warnings = [], instances = {}, tasks = new Set(), modelCallbacks = [];
  try {
    const React = require('react'); ReactDOM = require('react-dom');
    const dva = require('dva');
    const reduxProvider = require(require.resolve('react-redux', { paths: [require.resolve('dva')] }));
    assert.equal(dva.connect, reduxProvider.connect);
    const { createStore, applyMiddleware } = require('redux');
    const box = () => null;
    box.Item = box.Group = box.SubMenu = box; box.defaultProps = {};
    const pass = props => React.createElement(React.Fragment, null, props.children);
    pass.Content = pass;
    const Dropdown = props => React.createElement('div', null, props.children, props.visible ? props.overlay : null);
    const Input = { Search: props => { latestSearchProps = props; return React.createElement('input', { onChange: props.onChange }); } };
    const observeConnect = (...args) => Component => {
      const name = Component.name;
      const didMount = Component.prototype.componentDidMount;
      Component.prototype.componentDidMount = function observedMount() {
        (instances[name] || (instances[name] = [])).push(this);
        const original = this.setState;
        this.setState = function observeState(update, callback) {
          if (name === 'SelectApp' && delayNextState && typeof update === 'function') {
            delayNextState = false; queuedState = { instance: this, update, callback, original }; return;
          }
          return original.call(this, update, callback);
        };
        return didMount && didMount.call(this);
      };
      if (name === 'TeamLayout') {
        const didUpdate = Component.prototype.componentDidUpdate;
        Component.prototype.componentDidUpdate = function observedUpdate(...args) {
          if (options.beforeLayoutUpdate) options.beforeLayoutUpdate(this);
          return didUpdate.apply(this, args);
        };
      }
      return dva.connect(...args)(Component);
    };
    const permissions = { team: { team_overview: true, team_app_create: true, revision: 1 } };
    const team = name => ({ team_name: name, tenant_actions: permissions,
      region: [{ team_region_name: currentRegion, region_status: '1' }] });
    const user = { user_id: options.unknownUser ? undefined : 'user-a', enterprise_id: 'enterprise-a',
      roles: ['admin'], is_enterprise_admin: false, teams: [team('team-a'), team('team-b')] };
    const role = { queryPermissionsInfo: () => ({ isAccess: true }) };
    const errorModule = { __esModule: true, default: error => warnings.push(error), notifyAPIWarning: value => warnings.push(value) };
    const fixtures = {
      react: React, dva: { ...dva, connect: observeConnect },
      'dva/router': { Link: props => React.createElement('a', { href: props.to }, props.children), Redirect: box,
        routerRedux: { push: payload => ({ type: 'router/push', payload }), replace: payload => ({ type: 'router/replace', payload }) } },
      antd: new Proxy({}, { get: (_, key) => key === 'notification' ? { warning: value => warnings.push(value), success() {} }
        : key === 'Layout' ? pass : key === 'Dropdown' ? Dropdown : key === 'Input' ? Input : box }),
      classnames: require('classnames'), 'prop-types': require('prop-types'),
      'enquire-js': { enquireScreen: callback => callback(false) },
      'react-transition-group': { TransitionGroup: pass, CSSTransition: pass },
      'react-container-query': { ContainerQuery: props => props.children({}) }, 'react-document-title': pass,
      '../utils/Authorized': pass, umi: { FormattedMessage: box }, '@/utils/intl': { formatMessage: value => value.id },
      '../utils/newRole': role, '../../utils/role': role,
      '../utils/rainbond': { isEnableBillingFunction: () => false, fetchLogo: () => '', fetchSiteTitle: () => '' },
      '../utils/user': { getTeamByTeamName: (value, name) => value && value.teams && value.teams.find(item => item.team_name === name),
        hasTeamAndRegion: (value, name, region) => value && value.teams && value.teams.find(item => item.team_name === name)?.region.find(item => item.team_region_name === region),
        isCompanyAdmin: () => false },
      '../utils/cookie': { set() {} }, '../utils/pulginUtils': { isInstallPlugin: () => false },
      '../utils/error': errorModule, '../../utils/error': errorModule,
      '../utils/missingResourceHelpers': require('../utils/missingResourceHelpers'),
      '../utils/teamOverviewBootstrap': require('../utils/teamOverviewBootstrap'),
      '../components/Team/TeamEventList/helpers': require('../components/Team/TeamEventList/helpers'),
      './customerServiceFloatVisibility': { shouldShowCustomerServiceFloat: () => false },
      './teamMenuEnterprise': { buildTeamMenuEnterpriseSettings: () => ({}) },
      '../common/appMenu': { getAppMenuData: () => [] }, '../common/teamMenu': { getMenuData: () => [] },
      '../common/helmMenu': { getHelmMenuData: () => [] },
      '../AddOrEditGroup': props => { latestCreateProps = props; return null; },
      '../components/GlobalHeader': props => headerWanted && props.customHeader ? props.customHeader() : null
    };
    const evaluate = (name, imports = {}) => {
      const module = { exports: {} };
      const schedule = name === 'global' && options.holdModelCallbacks
        ? callback => { modelCallbacks.push(callback); return modelCallbacks.length; } : setTimeout;
      new Function('module', 'exports', 'require', 'React', 'setTimeout', compiled[name])(module, module.exports, imported => {
        if (Object.prototype.hasOwnProperty.call(imports, imported)) return imports[imported];
        if (Object.prototype.hasOwnProperty.call(fixtures, imported)) return fixtures[imported];
        if (/\.(less|svg|png)$/.test(imported)) return {};
        return box;
      }, React, schedule);
      return module.exports;
    };
    const utility = evaluate('utility').default;
    fixtures['../utils/global'] = utility;
    const MenuContext = evaluate('context').default;
    fixtures['./MenuContext'] = MenuContext;
    const responseFor = record => ({ status_code: 200, list: JSON.parse(JSON.stringify(options.lists?.[record.query] || [
      { group_id: '35', group_name: 'application-35' }, { group_id: '36', group_name: 'application-36' }
    ])) });
    const request = (url, config = {}) => {
      const record = { url, config, query: config.params?.query || '', team: currentTeam, region: currentRegion };
      requests.push(record);
      if (options.hold) return new Promise((resolve, reject) => { record.resolve = resolve; record.reject = reject; });
      record.response = responseFor(record);
      return Promise.resolve(record.response);
    };
    const services = evaluate('service', { '../../config/api.config': { baseUrl: '' }, '../utils/request': request });
    model = evaluate('global', { '../services/team': services }).default;
    const initial = { global: { ...model.state, rainbondInfo: {}, enterprise: { enterprise_id: 'enterprise-a' }, novices: {} },
      user: { currentUser: user }, teamControl: { currentTeamPermissionsInfo: permissions, currentTeam: team('team-a') },
      application: { groupDetail: { ID: '35', app_type: 'rainbond' } }, enterprise: {}, index: {}, agent: {}, loading: { effects: {} } };
    const reducer = (state = initial, action) => {
      if (action.type === 'fixture/patch') return { ...state, ...action.payload };
      if (action.type === 'teamControl/fetchCurrentTeam') return { ...state, teamControl: { ...state.teamControl, currentTeam: action.payload } };
      if (action.type === 'teamControl/fetchCurrentTeamPermissions') return { ...state, teamControl: { ...state.teamControl, currentTeamPermissionsInfo: action.payload } };
      const [namespace, name] = action.type.split('/');
      if (namespace === 'global' && model.reducers[name]) {
        if (name === 'saveGroups') saved.push(action.payload);
        return { ...state, global: model.reducers[name](state.global, action) };
      }
      return state;
    };
    const middleware = () => next => action => {
      actions.push(action);
      if (action.type === 'global/fetchGroups') {
        const task = runSaga({ dispatch: value => store.dispatch({ ...value,
          type: value.type.includes('/') ? value.type : `global/${value.type}` }), getState: store.getState,
        onError: error => errors.push(error) }, model.effects.fetchGroups, action, sagaEffects);
        tasks.add(task); task.toPromise().then(() => tasks.delete(task), () => tasks.delete(task));
        return task.toPromise();
      }
      const result = next(action);
      if (action.callback) Promise.resolve().then(() => {
        let response = { status_code: 200, bean: {}, list: [] };
        if (action.type === 'region/getEnterpriseLicense') response.bean = { valid: true };
        if (action.type === 'global/fetchEnterpriseList') response.list = [{ enterprise_id: 'enterprise-a' }];
        if (action.type === 'user/fetchCurrent') response.bean = store.getState().user.currentUser;
        if (action.type === 'global/getTeamOverview') response.bean = { eid: 'enterprise-a', team_id: 'team-id' };
        if (action.type === 'application/fetchGroupDetail') response.bean = { ID: currentApp, group_id: currentApp };
        action.callback(response);
      });
      return Promise.resolve(result);
    };
    store = createStore(reducer, applyMiddleware(middleware));
    const Selector = evaluate('selector').default;
    const Header = evaluate('header', { '../../components/SelectApp': Selector }).default;
    const Layout = evaluate('layout', { './components/AppHeader': Header }).default;
    const container = dom.window.document.getElementById('root');
    const flush = async () => {
      for (let count = 0; count < 4; count += 1) { await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setTimeout(resolve, 0)); }
    };
    const mount = () => {
      const pathname = route === 'index' ? `/team/${currentTeam}/region/${currentRegion}/index`
        : `/team/${currentTeam}/region/${currentRegion}/apps/${currentApp}/${route}`;
      const location = { pathname, search };
      const match = { params: { teamName: currentTeam, regionName: currentRegion, appID: route === 'index' ? undefined : currentApp } };
      dom.window.history.replaceState(null, '', `/#${pathname}${search}`);
      const standaloneProps = { currentTeam: team(currentTeam), currentRegion: { team_region_name: currentRegion },
        currentAppID: currentApp, appID: currentApp, teamName: currentTeam, regionName: currentRegion, handleClick() {}, ...selectorProps };
      const tree = useLayout ? React.createElement(Layout, { match, location }, null)
        : React.createElement(standaloneHeader ? Header : Selector, standaloneProps);
      ReactDOM.render(React.createElement(reduxProvider.Provider, { store }, tree), container);
    };
    const groups = () => requests.filter(record => record.url.endsWith('/overview/groups'));
    const latest = name => instances[name]?.at(-1);
    const complete = (record, response = responseFor(record)) => {
      assert(record.resolve); const resolve = record.resolve; delete record.resolve;
      record.response = response; resolve(response);
    };
    const fail = (record, error = { data: { code: 503 } }) => {
      assert(record.resolve); if (record.config.handleError) record.config.handleError(error);
      const resolve = record.resolve; delete record.resolve; resolve(undefined);
    };
    mount(); await flush();
    await verify({ store, model, services, requests, actions, saved, errors, warnings, groups, latest, complete, fail, flush, responseFor,
      mountHeader: async (milliseconds = 0) => { if (milliseconds) await new Promise(resolve => setTimeout(resolve, milliseconds)); headerWanted = true; mount(); await flush(); },
      navigate: async changes => { currentApp = changes.app || currentApp; currentTeam = changes.team || currentTeam;
        currentRegion = changes.region || currentRegion; route = changes.route || route;
        if (Object.prototype.hasOwnProperty.call(changes, 'search')) search = changes.search;
        mount(); await flush(); },
      patch: async payload => { store.dispatch({ type: 'fixture/patch', payload }); await flush(); },
      beforeLayoutUpdate: callback => { options.beforeLayoutUpdate = callback; },
      hideHeader: async () => { headerWanted = false; mount(); await flush(); },
      standalone: async props => { ReactDOM.unmountComponentAtNode(container); useLayout = false; selectorProps = props || {}; mount(); await flush(); },
      standaloneHeader: async props => { ReactDOM.unmountComponentAtNode(container); useLayout = false; standaloneHeader = true;
        selectorProps = props || {}; mount(); await flush(); },
      selectorProps: async props => { selectorProps = { ...selectorProps, ...props }; mount(); await flush(); },
      searchProps: () => latestSearchProps, createProps: () => latestCreateProps,
      delayNextSelectorUpdater: () => { delayNextState = true; },
      queuedState: () => queuedState,
      flushModelCallbacks: async () => { modelCallbacks.splice(0).forEach(callback => callback()); await flush(); },
      applyQueuedState: async () => { assert(queuedState); const q = queuedState; queuedState = null;
        q.original.call(q.instance, q.update, q.callback); await flush(); },
      unmount: () => ReactDOM.unmountComponentAtNode(container)
    });
    if (!options.allowSagaError) assert.deepEqual(errors, []);
  } finally {
    if (ReactDOM) ReactDOM.unmountComponentAtNode(dom.window.document.getElementById('root'));
    tasks.forEach(task => task.cancel()); dom.window.close();
    Object.keys(globals).forEach(key => { if (previous[key]) Object.defineProperty(global, key, previous[key]); else delete global[key]; });
  }
}

test('late actual header/selector reuses Layout full-list prefetch completed 700 ms earlier', () => withGroups(async h => {
  assert.equal(h.groups().length, 1);
  await h.mountHeader(700);
  assert.equal(h.groups().length, 1);
  assert.equal(h.latest('SelectApp').state.currentApp.group_id, '35');
}));

test('pending full-list HTTP is shared by Layout and actual connected selector', () => withGroups(async h => {
  await h.mountHeader();
  assert.equal(h.groups().length, 1);
  h.complete(h.groups()[0]); await h.flush();
  assert.equal(h.latest('SelectApp').state.teamApps.length, 2);
}, { hold: true }));

test('selector copy.reverse preserves Redux and owner response order', () => withGroups(async h => {
  await h.mountHeader();
  assert.deepEqual(h.store.getState().global.groups.map(app => app.group_id), ['35', '36']);
  assert.deepEqual(h.groups()[0].response.list.map(app => app.group_id), ['35', '36']);
  assert.deepEqual(h.latest('SelectApp').state.teamApps.map(app => app.group_id), ['36', '35']);
}));

test('search, empty results and actual clear-onChange make fresh requests and restore full list', () => withGroups(async h => {
  await h.mountHeader();
  const selector = h.latest('SelectApp');
  selector.handleEnter(); await h.flush();
  selector.queryApps('absent'); await h.flush();
  assert.equal(h.groups().length, 2);
  assert.deepEqual(selector.state.teamApps, []);
  assert.deepEqual(h.store.getState().global.groups, []);
  assert.equal(typeof h.searchProps().onChange, 'function', 'Antd 3.19 clear uses onChange');
  h.searchProps().onChange({ target: { value: '' } }); await h.flush();
  assert.equal(h.groups().length, 3);
  assert.equal(h.groups()[2].query, '');
  assert.equal(selector.state.teamApps.length, 2);
}, { lists: { absent: [] } }));

test('search invalidates a pending full read before it can overwrite current Redux or local data', () => withGroups(async h => {
  await h.mountHeader();
  const selector = h.latest('SelectApp');
  selector.queryApps('one'); await h.flush();
  assert.equal(h.groups().length, 2);
  const search = h.groups()[1]; h.complete(search, { status_code: 200, list: [{ group_id: '36', group_name: 'only-result' }] });
  await h.flush();
  h.complete(h.groups()[0]); await h.flush();
  assert.deepEqual(h.store.getState().global.groups.map(app => app.group_id), ['36']);
  assert.deepEqual(selector.state.teamApps.map(app => app.group_id), ['36']);
}, { hold: true }));

test('newest search generation wins even when an old search completes last', () => withGroups(async h => {
  h.complete(h.groups()[0]); await h.flush(); await h.mountHeader();
  const selector = h.latest('SelectApp');
  selector.queryApps('old'); await h.flush();
  selector.queryApps('new'); await h.flush();
  h.complete(h.groups().find(record => record.query === 'new'), { status_code: 200, list: [{ group_id: '36' }] }); await h.flush();
  h.complete(h.groups().find(record => record.query === 'old'), { status_code: 200, list: [{ group_id: '35' }] }); await h.flush();
  assert.deepEqual(h.store.getState().global.groups, [{ group_id: '36' }]);
  assert.deepEqual(selector.state.teamApps, [{ group_id: '36' }]);
}, { hold: true }));

test('valid create with a nonempty query invalidates pre-create owner and reads fresh', () => withGroups(async h => {
  await h.mountHeader(); const selector = h.latest('SelectApp');
  selector.queryApps('filtered'); await h.flush();
  selector.showCreateApp(); await h.flush();
  const callback = h.createProps().onOk;
  const before = h.groups().length; callback(); await h.flush();
  assert.equal(h.groups().length, before + 1);
  assert.equal(h.groups().at(-1).query, 'filtered');
  await h.hideHeader(); await h.mountHeader();
  assert.equal(h.groups().length, before + 2, 'new initial full read cannot reuse the pre-create snapshot');
}));

test('old create-modal callbacks cannot close or refresh a newer scoped modal', () => withGroups(async h => {
  await h.mountHeader(); h.latest('SelectApp').showCreateApp(); await h.flush();
  const old = h.createProps();
  await h.navigate({ app: '36' });
  h.latest('SelectApp').showCreateApp(); await h.flush();
  const before = h.groups().length;
  old.onOk(); old.onCancel(); await h.flush();
  assert.equal(h.groups().length, before);
  assert.equal(h.latest('SelectApp').state.showCreateApp, true);
}));

test('scope changes automatically read fresh and stale full response cannot update Redux', () => withGroups(async h => {
  await h.mountHeader(); const old = h.groups()[0];
  await h.navigate({ app: '36' });
  assert.equal(h.groups().length, 2);
  h.complete(h.groups()[1], { status_code: 200, list: [{ group_id: '36', group_name: 'current' }] }); await h.flush();
  h.complete(old); await h.flush();
  assert.deepEqual(h.store.getState().global.groups.map(app => app.group_id), ['36']);
  assert.equal(h.latest('SelectApp').state.currentApp.group_id, '36');
}, { hold: true }));

for (const field of ['user', 'enterprise', 'admin', 'roles', 'permissions', 'team', 'region']) {
  test(`${field} change invalidates initial list and automatically reads the new scope`, () => withGroups(async h => {
    await h.mountHeader(); const old = h.groups()[0]; const state = h.store.getState();
    if (field === 'team' || field === 'region') await h.navigate({ [field]: field === 'team' ? 'team-b' : 'region-b' });
    else if (field === 'permissions') await h.patch({ teamControl: { ...state.teamControl,
      currentTeamPermissionsInfo: { team: { ...state.teamControl.currentTeamPermissionsInfo.team, revision: 2 } } } });
    else {
      const currentUser = { ...state.user.currentUser };
      if (field === 'user') currentUser.user_id = 'user-b';
      if (field === 'enterprise') currentUser.enterprise_id = 'enterprise-b';
      if (field === 'admin') currentUser.is_enterprise_admin = true;
      if (field === 'roles') currentUser.roles = ['reader'];
      await h.patch({ user: { currentUser } });
    }
    assert.equal(h.groups().length, 2);
    h.complete(h.groups()[1], { status_code: 200, list: [{ group_id: '36', group_name: 'current-scope' }] }); await h.flush();
    h.complete(old); await h.flush();
    assert.deepEqual(h.store.getState().global.groups, [{ group_id: '36', group_name: 'current-scope' }]);
  }, { hold: true }));
}

test('old scope is rejected before the parent Layout CDU and then current scope still reads', () => withGroups(async h => {
  await h.mountHeader(); let checked = false;
  const oldOwnerAction = h.actions.find(action => action.type === 'global/fetchGroups' && action.onResponse);
  h.beforeLayoutUpdate(layout => {
    if (checked || h.store.getState().user.currentUser.user_id !== 'user-b') return;
    checked = true;
    assert.equal(oldOwnerAction.shouldApply(), false, 'old raw effect must reject before its parent CDU invalidates the entry');
  });
  const state = h.store.getState();
  await h.patch({ user: { currentUser: { ...state.user.currentUser, user_id: 'user-b' } } });
  assert.equal(checked, true);
  assert.equal(h.groups().length, 2);
}));

test('explicit unknown scope with no loader never falls back, then automatically starts a current read', () => withGroups(async h => {
  const before = h.groups().length;
  await h.standalone({ initialGroupsScope: '', initialGroupsLoader: undefined });
  assert.equal(h.groups().length, before);
  assert.equal(h.latest('SelectApp').state.loading, false);
  await h.selectorProps({ initialGroupsScope: 'known-current' });
  assert.equal(h.groups().length, before + 1);
  assert.equal(h.latest('SelectApp').state.teamApps.length, 2);
}));

test('unknown principal performs no initial HTTP, then known identity initializes once', () => withGroups(async h => {
  await h.mountHeader(); assert.equal(h.groups().length, 0);
  const state = h.store.getState();
  await h.patch({ user: { currentUser: { ...state.user.currentUser, user_id: 'user-a' } } });
  assert.equal(h.groups().length, 1);
  assert.equal(h.latest('SelectApp').state.teamApps.length, 2);
}, { unknownUser: true }));

test('queued old local updater rechecks scope after a newer identity is mounted', () => withGroups(async h => {
  await h.mountHeader();
  h.delayNextSelectorUpdater(); h.complete(h.groups()[0]); await h.flush();
  assert(h.queuedState(), 'production callback must enqueue a function updater');
  const old = h.queuedState(); const state = h.store.getState();
  await h.patch({ user: { currentUser: { ...state.user.currentUser, user_id: 'user-b' } } });
  assert.equal(old.update.call(old.instance, old.instance.state, old.instance.props), null);
  h.complete(h.groups().at(-1), { status_code: 200, list: [{ group_id: '36' }] }); await h.flush();
  await h.applyQueuedState();
  assert.deepEqual(h.latest('SelectApp').state.teamApps, [{ group_id: '36' }]);
}, { hold: true }));

test('current app selection follows currentAppID without retaining the old app title', () => withGroups(async h => {
  await h.standalone({ initialGroupsScope: 'same-current-scope' });
  assert.equal(h.latest('SelectApp').state.currentApp.group_id, '35');
  const before = h.groups().length;
  await h.selectorProps({ currentAppID: '36' });
  assert.equal(h.latest('SelectApp').state.currentApp.group_id, '36');
  assert.equal(h.groups().length, before);
  await h.selectorProps({ currentAppID: 'missing' });
  assert.deepEqual(h.latest('SelectApp').state.currentApp, {});
}));

test('same Overview visit remount shares, leaving and returning reads new, drawer query does not', () => withGroups(async h => {
  await h.mountHeader(); await h.hideHeader(); await h.mountHeader();
  assert.equal(h.groups().length, 1);
  await h.navigate({ search: '?type=components&componentID=demo&tab=overview' });
  assert.equal(h.groups().length, 1);
  await h.navigate({ route: 'version' }); const afterLeave = h.groups().length;
  await h.navigate({ route: 'overview' });
  assert.equal(h.groups().length, afterLeave + 1);
}));

test('ordinary team pathname navigation adds no new Layout prefetch', () => withGroups(async h => {
  const before = h.groups().length;
  await h.navigate({ search: '?tab=dynamic' });
  assert.equal(h.groups().length, before);
}, { route: 'index' }));

test('raw global caller retains asynchronous callback and synchronous onResponse contract', () => withGroups(async h => {
  const order = [];
  await h.store.dispatch({ type: 'global/fetchGroups', payload: { team_name: 'team-a', region_name: 'region-a' },
    onResponse: response => { assert.equal(response.status_code, 200); order.push('response'); },
    callback: list => { assert.equal(list.length, 2); order.push('callback'); } });
  assert.deepEqual(order, ['response']); await h.flush();
  assert.deepEqual(order, ['response', 'callback']);
  const record = h.groups().at(-1);
  assert.deepEqual(Object.keys(record.config).sort(), ['handleError', 'method', 'noModels', 'params']);
  assert.deepEqual(Object.keys(record.config.params).sort(), ['query', 'region_name']);
}));

test('raw global service exception still rejects without being silently swallowed', () => withGroups(async h => {
  const pending = h.store.dispatch({ type: 'global/fetchGroups', payload: { team_name: 'team-a', region_name: 'region-a' } });
  const error = new Error('transport fixture');
  h.groups().at(-1).reject(error);
  await assert.rejects(pending, value => value === error);
  assert.equal(h.errors[0], error);
}, { hold: true, allowSagaError: true }));

test('owner failure notifies once, ends selector loading and does not auto-retry on remount', () => withGroups(async h => {
  await h.mountHeader(); h.fail(h.groups()[0]); await h.flush();
  assert.equal(h.groups().length, 1);
  assert.equal(h.warnings.length, 1);
  assert.equal(h.latest('SelectApp').state.loading, false);
  await h.hideHeader(); await h.mountHeader();
  assert.equal(h.groups().length, 1);
  assert.equal(h.warnings.length, 1);
  assert.equal(h.latest('SelectApp').state.loading, false);
  h.latest('SelectApp').queryApps(''); await h.flush();
  assert.equal(h.groups().length, 2, 'an explicit clear remains a fresh recovery action');
  h.complete(h.groups()[1]); await h.flush();
  assert.equal(h.latest('SelectApp').state.teamApps.length, 2);
}, { hold: true }));

test('consumer unmount does not cancel Layout work and a later consumer shares its result', () => withGroups(async h => {
  await h.mountHeader(); const oldSelector = h.latest('SelectApp');
  await h.hideHeader(); h.complete(h.groups()[0]); await h.flush();
  assert.deepEqual(oldSelector.state.teamApps, []);
  assert.deepEqual(h.store.getState().global.groups.map(app => app.group_id), ['35', '36']);
  await h.mountHeader();
  assert.equal(h.groups().length, 1);
  assert.equal(h.latest('SelectApp').state.teamApps.length, 2);
}, { hold: true }));

test('a stale timed callback cannot restore full data after a fresh search', () => withGroups(async h => {
  await h.mountHeader();
  assert.deepEqual(h.latest('SelectApp').state.teamApps, []);
  h.latest('SelectApp').queryApps('single'); await h.flush();
  await h.flushModelCallbacks();
  assert.deepEqual(h.latest('SelectApp').state.teamApps.map(app => app.group_id), ['36']);
  assert.deepEqual(h.store.getState().global.groups.map(app => app.group_id), ['36']);
}, { holdModelCallbacks: true, lists: { single: [{ group_id: '36' }] } }));

test('same user after unknown logout initializes fresh instead of reusing the old full list', () => withGroups(async h => {
  await h.mountHeader(); const state = h.store.getState();
  const user = state.user.currentUser;
  await h.patch({ user: { currentUser: { ...user, user_id: undefined } } });
  assert.equal(h.groups().length, 1);
  assert.deepEqual(h.latest('SelectApp').state.teamApps, []);
  await h.patch({ user: { currentUser: { ...user } } });
  assert.equal(h.groups().length, 2);
  assert.equal(h.latest('SelectApp').state.teamApps.length, 2);
}));

test('equal hydration and drawer query share, real refresh-token changes initialize once each', () => withGroups(async h => {
  await h.mountHeader(); const state = h.store.getState();
  await h.patch({ user: JSON.parse(JSON.stringify(state.user)), teamControl: JSON.parse(JSON.stringify(state.teamControl)) });
  await h.navigate({ search: '?refresh=' });
  assert.equal(h.groups().length, 1);
  await h.navigate({ search: '?refresh=false' });
  assert.equal(h.groups().length, 2);
  await h.navigate({ search: '?refresh=false&type=components&componentID=demo' });
  assert.equal(h.groups().length, 2);
  await h.navigate({ search: '?refresh=next-token' });
  assert.equal(h.groups().length, 3);
}));

test('owner refuses filtered or stale team/region payloads without creating another request', () => withGroups(async h => {
  const layout = h.latest('TeamLayout'); const before = h.groups().length;
  for (const payload of [
    { team_name: 'team-a', region_name: 'region-a', query: 'filtered' },
    { team_name: 'other', region_name: 'region-a', query: '' },
    { team_name: 'team-a', region_name: 'other', query: '' }
  ]) await assert.rejects(layout.loadInitialTeamGroups(payload), error => error.code === 'TEAM_OVERVIEW_STALE');
  assert.equal(h.groups().length, before);
}));

test('a forced full read creates a new transport request while old full HTTP is pending', () => withGroups(async h => {
  const layout = h.latest('TeamLayout');
  const fresh = layout.loadInitialTeamGroups({ team_name: 'team-a', region_name: 'region-a', query: '' }, { force: true });
  assert.equal(h.groups().length, 2);
  h.complete(h.groups()[1], { status_code: 200, list: [{ group_id: '36' }] }); await fresh; await h.flush();
  h.complete(h.groups()[0]); await h.flush();
  assert.deepEqual(h.store.getState().global.groups, [{ group_id: '36' }]);
}, { hold: true }));

test('legacy AppHeader with no groups metadata preserves one normal selector read', () => withGroups(async h => {
  const before = h.groups().length;
  await h.standaloneHeader({});
  assert.equal(h.groups().length, before + 1);
  assert.equal(h.latest('SelectApp').state.teamApps.length, 2);
  assert.equal(Object.prototype.hasOwnProperty.call(h.latest('SelectApp').props, 'initialGroupsScope'), false);
}));

for (const initialGroupsScope of ['', undefined]) {
  test(`legacy AppHeader retains explicitly unknown ${initialGroupsScope === '' ? 'empty' : 'undefined'} scope as zero reads`, () => withGroups(async h => {
    const before = h.groups().length;
    await h.standaloneHeader({ initialGroupsScope });
    assert.equal(h.groups().length, before);
    assert.equal(Object.prototype.hasOwnProperty.call(h.latest('SelectApp').props, 'initialGroupsScope'), true);
    assert.equal(h.latest('SelectApp').state.loading, false);
  }));
}
