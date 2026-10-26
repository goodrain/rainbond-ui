/*
 * Connected integration: production TeamLayout -> MenuContext -> Group Overview
 * -> application header, actual DVA connect, model generators/reducers and
 * service functions. Only unrelated visuals/setup APIs and final HTTP are fixtures.
 * This is a local React integration test, not a deployed or full-app E2E test.
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
const paths = {
  layout: 'src/layouts/TeamLayout.js', overview: 'src/pages/Group/Overview.js',
  header: 'src/components/SlidePanel/components/app.js',
  model: 'src/models/application.js', service: 'src/services/application.js',
  globalUtil: 'src/utils/global.js', context: 'src/layouts/MenuContext.js'
};
const compiled = Object.fromEntries(Object.entries(paths).map(([key, relative]) => [key,
  babel.transformSync(fs.readFileSync(path.join(repo, relative), 'utf8'), {
    filename: path.join(repo, relative), babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
      [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
  }).code
]));

async function withApplication(verify, options = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1/' });
  const browserGlobals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    MessageChannel: undefined, requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout };
  Object.assign(dom.window, { requestAnimationFrame: browserGlobals.requestAnimationFrame,
    cancelAnimationFrame: browserGlobals.cancelAnimationFrame });
  const previous = Object.fromEntries(Object.keys(browserGlobals).map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  Object.entries(browserGlobals).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
  let ReactDOM, store, model, currentApp = '35', currentTeam = 'test-team', currentRegion = 'test-region';
  let search = options.search || '', route = options.route || 'overview', showPage = false, layoutMounted = true;
  const requests = [], actions = [], writes = [], errors = [], warnings = [], instances = {}, tasks = new Set(), viewCallbacks = {};
  try {
    const React = require('react'); ReactDOM = require('react-dom');
    const dva = require('dva');
    const redux5 = require(require.resolve('react-redux', { paths: [require.resolve('dva')] }));
    assert.equal(dva.connect, redux5.connect, 'use the Provider that the production DVA connect consumes');
    const { createStore, applyMiddleware } = require('redux');
    const box = () => null;
    box.Item = box.Group = box.SubMenu = box;
    box.defaultProps = {};
    const pass = props => React.createElement(React.Fragment, null, props.children);
    pass.Content = pass;
    const observeConnect = (...args) => Component => {
      const name = Component.name;
      const didMount = Component.prototype.componentDidMount;
      Component.prototype.componentDidMount = function observedMount() {
        (instances[name] || (instances[name] = [])).push(this);
        const original = this.setState;
        this.setState = function observedState(update, callback) {
          writes.push({ instance: this, update });
          return original.call(this, update, callback);
        };
        return didMount && didMount.call(this);
      };
      if (name === 'TeamLayout') {
        const didUpdate = Component.prototype.componentDidUpdate;
        Component.prototype.componentDidUpdate = function observeBeforeLayoutUpdate(...values) {
          if (options.beforeLayoutUpdate) options.beforeLayoutUpdate(this);
          return didUpdate.apply(this, values);
        };
      }
      return dva.connect(...args)(Component);
    };
    const roleUtil = { queryPermissionsInfo: () => ({ isAccess: true }), queryTeamOrAppPermissionsInfo: () => ({}) };
    const permissions = { team: { team_overview: true, team_app_create: true, revision: 1 } };
    const team = name => ({ team_name: name, tenant_actions: permissions, region: [{ team_region_name: currentRegion }] });
    const user = { user_id: 'user-a', enterprise_id: 'enterprise-a', is_enterprise_admin: false,
      roles: ['admin'], teams: [team('test-team'), team('other-team')] };
    const fixtures = {
      react: React, dva: { ...dva, connect: observeConnect },
      'dva/router': { routerRedux: { push: payload => ({ type: 'router/push', payload }),
        replace: payload => ({ type: 'router/replace', payload }) }, Redirect: box },
      antd: new Proxy({}, { get: (target, key) => key === 'notification'
        ? { warning: value => warnings.push(value), success() {} } : key === 'Layout' ? pass : box }),
      classnames: require('classnames'), 'prop-types': require('prop-types'),
      'enquire-js': { enquireScreen: callback => callback(false) },
      'react-transition-group': { TransitionGroup: pass, CSSTransition: pass },
      'react-container-query': { ContainerQuery: props => props.children({}) },
      'react-document-title': pass,
      '../utils/Authorized': pass, umi: { FormattedMessage: box },
      '@/utils/intl': { formatMessage: value => value.id },
      '@/utils/newRole': roleUtil, '../utils/newRole': roleUtil,
      '@/utils/rainbond': { handleNewbie: () => false },
      '../utils/rainbond': { isEnableBillingFunction: () => false, fetchLogo: () => '', fetchSiteTitle: () => '' },
      '@/utils/pageHeaderSvg': { getSvg: () => null }, moment: require('moment'),
      '../utils/user': { getTeamByTeamName: (value, name) => value && value.teams && value.teams.find(item => item.team_name === name),
        hasTeamAndRegion: (value, name, region) => value && value.teams && value.teams.find(item => item.team_name === name)?.region.find(item => item.team_region_name === region),
        isCompanyAdmin: () => false },
      '../utils/cookie': { set() {} },
      '../utils/pulginUtils': { isInstallPlugin: () => false },
      '../utils/error': { notifyAPIWarning: value => warnings.push(value) },
      '../utils/missingResourceHelpers': require('../utils/missingResourceHelpers'),
      '../../utils/missingResourceHelpers': require('../utils/missingResourceHelpers'),
      '../utils/teamOverviewBootstrap': require('../utils/teamOverviewBootstrap'),
      '../components/Team/TeamEventList/helpers': require('../components/Team/TeamEventList/helpers'),
      './customerServiceFloatVisibility': { shouldShowCustomerServiceFloat: () => false },
      './teamMenuEnterprise': { buildTeamMenuEnterpriseSettings: (enterprise, current) => enterprise || current || {} },
      '../common/appMenu': { getAppMenuData: () => [] }, '../common/teamMenu': { getMenuData: () => [] },
      '../common/helmMenu': { getHelmMenuData: () => [] },
      '@/components/ApplicationGovernance': props => { viewCallbacks.governance = props.onOk; return null; },
      '../../../pages/Group/AddServiceComponent': props => { viewCallbacks.componentCreated = props.refreshCurrent; return null; },
      './componentViewPerformance': require('../components/SlidePanel/components/componentViewPerformance')
    };
    const evaluate = (key, imports = {}) => {
      const module = { exports: {} };
      new Function('module', 'exports', 'require', 'React', compiled[key])(module, module.exports, name => {
        if (Object.prototype.hasOwnProperty.call(imports, name)) return imports[name];
        if (Object.prototype.hasOwnProperty.call(fixtures, name)) return fixtures[name];
        if (/\.(less|svg|png)$/.test(name)) return {};
        return box;
      }, React);
      return module.exports;
    };
    const globalUtil = evaluate('globalUtil').default;
    fixtures['@/utils/global'] = fixtures['../utils/global'] = globalUtil;
    const MenuContext = evaluate('context').default;
    fixtures['./MenuContext'] = fixtures['../../layouts/MenuContext'] = MenuContext;
    const isDetail = record => /\/groups\/[^/]+$/.test(record.url) &&
      (!record.config.method || record.config.method.toLowerCase() === 'get');
    const responseFor = record => ({ status_code: 200, bean: { ID: record.app,
      group_id: record.app, group_name: `application-${record.app}`, app_type: options.helm ? 'helm' : 'rainbond',
      tenant_name: record.team, governance_mode: 'default' } });
    const request = (url, config = {}) => {
      const record = { url, config, app: currentApp, team: currentTeam, region: currentRegion };
      requests.push(record);
      if (isDetail(record)) {
        if (options.holdDetail) return new Promise((resolve, reject) => { record.resolve = resolve; record.reject = reject; });
        return Promise.resolve(responseFor(record));
      }
      if (/\/(status|operator-managed|upgradable_num)$/.test(url))
        return new Promise(resolve => { record.resolve = resolve; });
      if (url.endsWith('/service/group')) {
        if (options.holdApps) return new Promise(resolve => { record.resolve = resolve; });
        return Promise.resolve({ status_code: 200, list: [] });
      }
      return Promise.resolve({ status_code: 200, list: [], bean: {} });
    };
    const services = evaluate('service', { '../../config/api.config': { baseUrl: '' }, '../utils/request': request });
    model = evaluate('model', { '../services/application': services }).default;
    const initial = { application: { ...model.state }, teamControl: { currentTeamPermissionsInfo: permissions,
      currentTeam: team('test-team'), currentRegionName: currentRegion, pluginsList: [] }, user: { currentUser: user },
    enterprise: { currentEnterprise: { enterprise_id: 'enterprise-a' } }, index: {}, agent: {},
    global: { collapsed: false, novices: {}, rainbondInfo: {}, enterprise: { enterprise_id: 'enterprise-a' } }, loading: { effects: {} } };
    const reducer = (state = initial, action) => {
      if (action.type === 'fixture/patch') return { ...state, ...action.payload };
      const [namespace, name] = action.type.split('/');
      return namespace === 'application' && model.reducers[name]
        ? { ...state, application: model.reducers[name](state.application, action) } : state;
    };
    const middleware = () => next => action => {
      actions.push(action);
      const [namespace, name] = action.type.split('/');
      if (namespace === 'application' && model.effects[name]) {
        const task = runSaga({ dispatch: value => store.dispatch({ ...value,
          type: value.type.includes('/') ? value.type : `application/${value.type}` }), getState: store.getState,
        onError: error => errors.push(error) }, model.effects[name], action, sagaEffects);
        tasks.add(task);
        task.toPromise().then(() => tasks.delete(task), () => tasks.delete(task));
        return task.toPromise();
      }
      const result = next(action);
      if (action.callback) Promise.resolve().then(() => {
        let response = { status_code: 200, list: [], bean: {} };
        if (action.type === 'region/getEnterpriseLicense') response.bean = { valid: true };
        if (action.type === 'global/fetchEnterpriseList') response.list = [{ enterprise_id: 'enterprise-a' }];
        if (action.type === 'user/fetchCurrent') response.bean = store.getState().user.currentUser;
        if (action.type === 'global/getTeamOverview') response.bean = { eid: 'enterprise-a', team_id: 'team-id' };
        action.callback(response);
      });
      return Promise.resolve(result);
    };
    store = createStore(reducer, applyMiddleware(middleware));
    const Header = evaluate('header').default;
    const Overview = evaluate('overview', { '@/components/SlidePanel/components/app': Header }).default;
    const Layout = evaluate('layout').default;
    const container = dom.window.document.getElementById('root');
    const flush = async () => { for (let index = 0; index < 8; index += 1) await new Promise(resolve => setImmediate(resolve)); };
    const mount = () => {
      const pathname = `/team/${currentTeam}/region/${currentRegion}/apps/${currentApp}/${route}`;
      const location = { pathname, search };
      const match = { params: { teamName: currentTeam, regionName: currentRegion, appID: currentApp } };
      dom.window.history.replaceState(null, '', `/#${pathname}${search}`);
      const child = showPage && route === 'overview' ? React.createElement(Overview, { key: pathname, match, location }) : null;
      const tree = layoutMounted ? React.createElement(Layout, { match, location }, child) : child;
      ReactDOM.render(React.createElement(redux5.Provider, { store }, tree), container);
    };
    const details = () => requests.filter(isDetail);
    const latest = name => instances[name] && instances[name].at(-1);
    const complete = (record, value = responseFor(record)) => {
      assert(record.resolve, 'request is still pending');
      const resolve = record.resolve; delete record.resolve; resolve(value);
    };
    const fail = (record, error) => {
      assert(record.resolve, 'request is still pending');
      if (record.config.handleError) record.config.handleError(error);
      const resolve = record.resolve; delete record.resolve; resolve(undefined);
    };
    mount(); await flush();
    await verify({ requests, actions, errors, warnings, writes, instances, store, services, details, latest, complete, fail, flush, viewCallbacks,
      responseFor, mountPage: async (delay = 0) => { if (delay) await new Promise(resolve => setTimeout(resolve, delay)); showPage = true; mount(); await flush(); },
      navigate: async (changes = {}) => {
        currentApp = changes.app || currentApp; currentTeam = changes.team || currentTeam; currentRegion = changes.region || currentRegion;
        if (Object.prototype.hasOwnProperty.call(changes, 'search')) search = changes.search;
        if (Object.prototype.hasOwnProperty.call(changes, 'route')) route = changes.route;
        if (Object.prototype.hasOwnProperty.call(changes, 'showPage')) showPage = changes.showPage;
        mount(); await flush();
      },
      patch: async payload => { store.dispatch({ type: 'fixture/patch', payload }); await flush(); },
      beforeLayoutUpdate: callback => { options.beforeLayoutUpdate = callback; },
      changeGlobalURL: (app, team = currentTeam, region = currentRegion) => {
        dom.window.history.replaceState(null, '', `/#/team/${team}/region/${region}/apps/${app}/overview`);
      },
      unmount: () => ReactDOM.unmountComponentAtNode(container),
      standalone: async () => { ReactDOM.unmountComponentAtNode(container); layoutMounted = false; showPage = true; mount(); await flush(); }
    });
    assert.deepEqual(errors, []);
  } finally {
    if (ReactDOM) ReactDOM.unmountComponentAtNode(dom.window.document.getElementById('root'));
    tasks.forEach(task => task.cancel()); dom.window.close();
    Object.keys(browserGlobals).forEach(key => { if (previous[key]) Object.defineProperty(global, key, previous[key]); else delete global[key]; });
  }
}

test('completed Layout prefetch is shared when connected Overview mounts 700 ms later', () => withApplication(async h => {
  assert.equal(h.details().length, 1, 'production Layout mount must actually prefetch');
  await h.mountPage(700);
  assert.equal(h.details().length, 1, 'late Overview and header reuse the completed Layout read');
  assert.equal(h.latest('app').state.currApp.ID, '35');
}));

test('pending Layout prefetch is shared by connected Overview and header', () => withApplication(async h => {
  await h.mountPage();
  assert.equal(h.details().length, 1);
  h.complete(h.details()[0]); await h.flush();
  assert.equal(h.latest('app').state.currApp.ID, '35');
}, { holdDetail: true }));

for (const helm of [false, true]) {
  test(`${helm ? 'Helm' : 'ordinary'} application retains exact initial detail in store, layout and header`, () => withApplication(async h => {
    await h.mountPage();
    const bean = h.responseFor(h.details()[0]).bean;
    assert.equal(h.details().length, 1);
    assert.deepEqual(h.store.getState().application.groupDetail, bean);
    assert.deepEqual(h.latest('TeamLayout').state.currentApp, bean);
    assert.deepEqual(h.latest('app').state.currApp, bean);
    const detailWire = h.details()[0].config;
    assert.deepEqual(detailWire.params, { region_name: 'test-region' });
    assert.deepEqual(Object.keys(detailWire).sort(), ['handleError', 'params']);
    for (const suffix of ['status', 'operator-managed', 'upgradable_num']) {
      assert.equal(h.requests.filter(record => record.url.endsWith(`/${suffix}`)).length, 1,
        `${suffix} retains its existing single initialization`);
    }
  }, { helm }));
}

test('equal Redux hydration and drawer changes retain the completed current visit', () => withApplication(async h => {
  await h.mountPage();
  const state = h.store.getState();
  await h.patch({ user: JSON.parse(JSON.stringify(state.user)), teamControl: JSON.parse(JSON.stringify(state.teamControl)),
    global: JSON.parse(JSON.stringify(state.global)) });
  await h.navigate({ search: '?type=components&componentID=example&tab=overview' });
  await h.navigate({ search: '?type=gateway' });
  assert.equal(h.details().length, 1);
}));

for (const search of ['', '?refresh=', '?refresh=false', '?refresh=initial-token']) {
  test(`initial query ${search || '(none)'} shares one detail read`, () => withApplication(async h => {
    await h.mountPage();
    assert.equal(h.details().length, 1);
  }, { search }));
}

test('changed refresh tokens read once each and unchanged tokens ignore drawer query', () => withApplication(async h => {
  await h.mountPage();
  assert.equal(h.details().length, 1);
  await h.navigate({ search: '?refresh=first-operation' });
  assert.equal(h.details().length, 2);
  await h.navigate({ search: '?refresh=first-operation&type=components&componentID=x' });
  assert.equal(h.details().length, 2);
  await h.navigate({ search: '?refresh=next-operation' });
  assert.equal(h.details().length, 3);
}));

test('real connected cold -> empty refresh -> false -> token starts one dependent set per refresh generation', () => withApplication(async h => {
  await h.mountPage();
  assert.equal(initializationReads(h).length, 3);
  await h.navigate({ search: '?refresh=' });
  assert.equal(h.details().length, 1);
  assert.equal(initializationReads(h).length, 3, 'empty refresh is the same generation as absent');
  await h.navigate({ search: '?refresh=false' });
  assert.equal(h.details().length, 2);
  assert.equal(initializationReads(h).length, 6, 'false refresh initializes each dependent only once');
  await h.navigate({ search: '?refresh=next-operation' });
  assert.equal(h.details().length, 3);
  assert.equal(initializationReads(h).length, 9, 'token refresh initializes each dependent only once');
}));

test('native popstate before Router props cannot initialize from an old settled refresh scope', () => withApplication(async h => {
  await h.mountPage();
  assert.equal(initializationReads(h).length, 3);
  for (const search of ['?refresh=false', '?refresh=next-operation']) {
    const before = initializationReads(h).length;
    global.window.history.replaceState(null, '', `/#/team/test-team/region/test-region/apps/35/overview${search}`);
    global.window.dispatchEvent(new global.window.PopStateEvent('popstate'));
    await h.flush();
    assert.equal(initializationReads(h).length, before, 'old Context props must not initialize the new raw refresh');
    await h.navigate({ search });
    assert.equal(initializationReads(h).length, before + 3, 'current Router scope initializes each dependent once');
    for (const suffix of ['status', 'operator-managed', 'upgradable_num']) {
      assert.equal(initializationReads(h).filter(record => record.url.endsWith(`/${suffix}`)).length,
        search === '?refresh=false' ? 2 : 3, `${suffix} starts once per refresh generation`);
    }
  }
  assert.equal(h.details().length, 3);
}));

test('native popstate leaving Overview cannot initialize from an old settled same-app scope', () => withApplication(async h => {
  await h.mountPage();
  const before = initializationReads(h).length;
  global.window.history.replaceState(null, '', '/#/team/test-team/region/test-region/apps/35/version');
  global.window.dispatchEvent(new global.window.PopStateEvent('popstate'));
  await h.flush();
  assert.equal(initializationReads(h).length, before, 'old same-app Header must also reject the changed pathname');
  await h.navigate({ route: 'version', search: '' });
  assert.equal(initializationReads(h).length, before);
}, { search: '?refresh=old-operation' }));

test('owned same-app pathname change rejects old read launches and callbacks even with the same refresh token', () => withApplication(async h => {
  await h.mountPage();
  const header = h.latest('app');
  const status = initializationReads(h).find(record => record.url.endsWith('/status'));
  const before = initializationReads(h).length;
  global.window.history.replaceState(null, '', '/#/team/test-team/region/test-region/apps/35/version?refresh=operation');
  header.loading(false);
  header.handleWaitLevel();
  h.complete(status, { status_code: 200, list: { status: 'obsolete' } });
  await h.flush();
  assert.equal(initializationReads(h).length, before);
  assert.notEqual(header.state.resources.status, 'obsolete');
}, { search: '?refresh=operation' }));

test('NoProvider native refresh retains one legacy parallel initialization after Router props catch up', () => withApplication(async h => {
  await h.standalone();
  assert.equal(initializationReads(h).length, 3);
  global.window.history.replaceState(null, '', '/#/team/test-team/region/test-region/apps/35/overview?refresh=false');
  global.window.dispatchEvent(new global.window.PopStateEvent('popstate'));
  await h.flush();
  assert.equal(initializationReads(h).length, 6);
  await h.navigate({ search: '?refresh=false' });
  assert.equal(initializationReads(h).length, 6, 'Router catchup does not restart the unowned Header');
}));

test('genuine leave and return invalidates the visit while a child-only remount shares it', () => withApplication(async h => {
  await h.mountPage();
  await h.navigate({ showPage: false });
  await h.mountPage();
  assert.equal(h.details().length, 1, 'internal child remount must not restart layout initialization');
  await h.navigate({ route: 'version' });
  await h.navigate({ route: 'overview' });
  assert.equal(h.details().length, 2, 'reentering Overview must read fresh');
}));

test('application 35 -> 36 -> 35 reads fresh per actual navigation', () => withApplication(async h => {
  await h.mountPage();
  await h.navigate({ app: '36' });
  assert.equal(h.details().length, 2);
  assert.equal(h.latest('app').state.currApp.ID, '36');
  await h.navigate({ app: '35' });
  assert.equal(h.details().length, 3);
  assert.equal(h.latest('app').state.currApp.ID, '35');
}));

for (const field of ['user_id', 'enterprise_id', 'is_enterprise_admin', 'roles', 'permissions']) {
  test(`known ${field} change starts one new isolated detail read`, () => withApplication(async h => {
    await h.mountPage();
    const state = h.store.getState();
    if (field === 'permissions') await h.patch({ teamControl: { ...state.teamControl,
      currentTeamPermissionsInfo: { team: { ...state.teamControl.currentTeamPermissionsInfo.team, revision: 2 } } } });
    else {
      const value = field === 'is_enterprise_admin' ? true : field === 'roles' ? ['reader'] : `${field}-new`;
      await h.patch({ user: { ...state.user, currentUser: { ...state.user.currentUser, [field]: value } } });
    }
    assert.equal(h.details().length, 2);
  }));
}

for (const changes of [{ team: 'other-team' }, { region: 'other-region' }]) {
  test(`route ${Object.keys(changes)[0]} change isolates and reloads detail`, () => withApplication(async h => {
    await h.mountPage();
    await h.navigate(changes);
    assert.equal(h.details().length, 2);
    assert.equal(h.details()[1].team, changes.team || 'test-team');
    assert.equal(h.details()[1].config.params.region_name, changes.region || 'test-region');
  }));
}

test('logout then login with same user ID does not restore the old result', () => withApplication(async h => {
  await h.mountPage();
  const user = h.store.getState().user;
  const listReads = () => h.requests.filter(record => record.url.endsWith('/service/group')).length;
  const beforeLogout = listReads();
  await h.patch({ user: { currentUser: {} } });
  assert.equal(h.details().length, 1, 'unknown principal must not start a detail read');
  assert.equal(listReads(), beforeLogout, 'unknown principal must not start a component-list read');
  await h.patch({ user });
  assert.equal(h.details().length, 2);
  assert.equal(listReads(), beforeLogout + 1, 'login automatically refreshes the current component list once');
}));

const initializationReads = h => h.requests.filter(record => /\/(status|operator-managed|upgradable_num)$/.test(record.url));

test('owned pending application detail does not initialize dependent reads before successful validation', () => withApplication(async h => {
  await h.mountPage();
  assert.equal(initializationReads(h).length, 0);
  h.complete(h.details()[0]); await h.flush();
  assert.equal(initializationReads(h).length, 3);
  for (const suffix of ['status', 'operator-managed', 'upgradable_num']) {
    assert.equal(initializationReads(h).filter(record => record.url.endsWith(`/${suffix}`)).length, 1);
  }
}, { holdDetail: true }));

test('owned missing application never initializes status operator or upgrades', () => withApplication(async h => {
  h.fail(h.details()[0], { code: 404, status: 404 }); await h.flush();
  await h.mountPage();
  assert.equal(h.details().length, 1);
  assert.equal(initializationReads(h).length, 0);
  assert.equal(h.warnings.length, 1);
}, { holdDetail: true }));

test('exit-animation header with old route props cannot start reads for the new global application', () => withApplication(async h => {
  await h.mountPage();
  const header = h.latest('app');
  assert.equal(header.componentMounted, true);
  h.changeGlobalURL('999999999');
  const offset = h.requests.length;
  header.loading();
  header.fetchAppDetailState(true);
  header.getOperator(true);
  header.handleWaitLevel();
  header.handleVisibilityChange();
  await h.flush();
  assert.equal(h.requests.length, offset, 'old mounted header cannot initialize requests for missing route');
}));

test('exit-animation header ignores old dependent HTTP successes and errors after global route changes', () => withApplication(async h => {
  await h.mountPage();
  const header = h.latest('app');
  const status = initializationReads(h).find(record => record.url.endsWith('/status'));
  const operator = initializationReads(h).find(record => record.url.endsWith('/operator-managed'));
  const upgrade = initializationReads(h).find(record => record.url.endsWith('/upgradable_num'));
  h.changeGlobalURL('999999999');
  const writeOffset = h.writes.length, actionOffset = h.actions.length;
  h.complete(status, { status_code: 200, list: { status: 'obsolete-status' } });
  h.fail(operator, { data: { msg_show: 'obsolete error' } });
  h.complete(upgrade, { status_code: 200, bean: { upgradable_num: 99 } });
  await h.flush();
  assert.equal(h.writes.length, writeOffset);
  assert.equal(h.actions.slice(actionOffset).some(action => /createApp|router\//.test(action.type)), false);
  assert.equal(h.warnings.length, 0);
  assert.equal(header.componentMounted, true, 'the test retains the actual old mounted header');
}));

test('new permission scope replaces dependent in-flight reads without old callbacks clearing fresh state or timers', () => withApplication(async h => {
  await h.mountPage();
  const old = initializationReads(h).slice();
  const state = h.store.getState();
  await h.patch({ teamControl: { ...state.teamControl,
    currentTeamPermissionsInfo: { team: { ...state.teamControl.currentTeamPermissionsInfo.team, revision: 2 } } } });
  const fresh = initializationReads(h).slice(old.length);
  assert.equal(fresh.length, 3, 'current validated scope starts one new dependent set');
  const header = h.latest('app'), offset = h.writes.length, actionOffset = h.actions.length;
  for (const record of old) {
    h.complete(record, record.url.endsWith('/operator-managed')
      ? { status_code: 200, list: { service: [{ static: 'fixture-address', name: 'obsolete-service' }] } }
      : record.url.endsWith('/upgradable_num') ? { status_code: 200, bean: { upgradable_num: 99 } }
        : { status_code: 200, list: { status: 'obsolete' } });
  }
  await h.flush();
  assert.equal(h.writes.length, offset);
  assert.equal(h.actions.slice(actionOffset).some(action => action.type.startsWith('createApp/')), false);
  assert.equal(header.statusRequestInFlight, true);
  assert.equal(header.operatorRequestInFlight, true);
  for (const record of fresh) {
    h.complete(record, record.url.endsWith('/operator-managed')
      ? { status_code: 200, list: { service: [] } }
      : record.url.endsWith('/upgradable_num') ? { status_code: 200, bean: { upgradable_num: 2 } }
        : { status_code: 200, list: { status: 'current' } });
  }
  await h.flush();
  assert.equal(header.state.resources.status, 'current');
  assert.equal(header.state.upgradableNum, 2);
  assert.equal(header.statusRequestInFlight, false);
  assert.equal(header.operatorRequestInFlight, false);
  assert.ok(header.statusTimer);
  assert.ok(header.operatorTimer);
}));

test('validated owned initialization preserves visible polling hidden pause and visible resume', context => withApplication(async h => {
  await h.mountPage();
  const header = h.latest('app');
  Object.defineProperty(global.document, 'hidden', { configurable: true, writable: true, value: false });
  context.mock.timers.enable({ apis: ['setTimeout'] });
  for (const record of initializationReads(h)) {
    h.complete(record, record.url.endsWith('/operator-managed')
      ? { status_code: 200, list: { service: [] } }
      : record.url.endsWith('/upgradable_num') ? { status_code: 200, bean: { upgradable_num: 0 } }
        : { status_code: 200, list: { status: 'current' } });
  }
  await h.flush();
  context.mock.timers.tick(15000); await h.flush();
  assert.equal(initializationReads(h).filter(record => record.url.endsWith('/status')).length, 2);
  const latestStatus = initializationReads(h).filter(record => record.url.endsWith('/status')).at(-1);
  h.complete(latestStatus, { status_code: 200, list: { status: 'current' } }); await h.flush();
  global.document.hidden = true; header.handleVisibilityChange();
  const beforeHidden = initializationReads(h).length;
  context.mock.timers.tick(60000); await h.flush();
  assert.equal(initializationReads(h).length, beforeHidden);
  global.document.hidden = false; header.handleVisibilityChange(); await h.flush();
  assert.equal(initializationReads(h).length, beforeHidden + 2, 'resume reads status and operator once');
}));

test('forced header reload while old HTTP is pending starts a fresh wire read', () => withApplication(async h => {
  await h.mountPage();
  assert.equal(initializationReads(h).length, 0);
  const oldRead = h.details()[0];
  h.latest('app').fetchAppDetail(); await h.flush();
  assert.equal(h.details().length, 2, 'force must bypass even the legacy in-flight service pool');
  const fresh = { ...h.responseFor(h.details()[1]), bean: { ...h.responseFor(h.details()[1]).bean, group_name: 'fresh' } };
  h.complete(h.details()[1], fresh); await h.flush();
  assert.equal(initializationReads(h).length, 3, 'only successful current detail initializes dependent reads');
  h.complete(oldRead, { ...h.responseFor(oldRead), bean: { ...h.responseFor(oldRead).bean, group_name: 'obsolete' } });
  await h.flush();
  assert.equal(initializationReads(h).length, 3, 'old detail completion cannot initialize another request set');
  assert.equal(h.store.getState().application.groupDetail.group_name, 'fresh');
  assert.equal(h.latest('TeamLayout').state.currentApp.group_name, 'fresh');
  assert.equal(h.latest('app').state.currApp.group_name, 'fresh');
}, { holdDetail: true }));

test('a failed initial read is shared without an automatic retry and force recovers', () => withApplication(async h => {
  h.fail(h.details()[0], { code: 500 }); await h.flush();
  await h.mountPage();
  assert.equal(h.details().length, 1);
  h.latest('app').fetchAppDetail(); await h.flush();
  assert.equal(h.details().length, 2);
  h.complete(h.details()[1]); await h.flush();
  assert.equal(h.latest('app').state.currApp.ID, '35');
}, { holdDetail: true }));

test('missing application reports and redirects once for all three consumers', () => withApplication(async h => {
  h.fail(h.details()[0], { code: 404, status: 404 }); await h.flush();
  await h.mountPage();
  assert.equal(h.details().length, 1);
  assert.equal(h.actions.filter(action => /router\/(push|replace)$/.test(action.type)).length, 1);
  assert.equal(h.warnings.length, 1);
}, { holdDetail: true }));

test('consumer unmount leaves the Layout request alive and allows a late consumer', () => withApplication(async h => {
  await h.mountPage();
  const oldHeader = h.latest('app');
  await h.navigate({ showPage: false });
  const offset = h.writes.length;
  h.complete(h.details()[0]); await h.flush();
  assert.equal(h.writes.slice(offset).some(write => write.instance === oldHeader), false);
  assert.equal(h.latest('TeamLayout').state.currentApp.ID, '35');
  await h.mountPage();
  assert.equal(h.details().length, 1);
  assert.equal(h.latest('app').state.currApp.ID, '35');
}, { holdDetail: true }));

test('layout unmount rejects all stale work without later store, local UI or navigation writes', () => withApplication(async h => {
  await h.mountPage();
  h.unmount();
  const offset = h.writes.length, saveCount = h.actions.filter(action => action.type === 'application/saveGroupDetail').length;
  h.complete(h.details()[0]); await h.flush();
  assert.equal(h.writes.length, offset);
  assert.equal(h.actions.filter(action => action.type === 'application/saveGroupDetail').length, saveCount);
  assert.equal(h.actions.filter(action => /router\//.test(action.type)).length, 0);
}, { holdDetail: true }));

test('standalone connected Overview retains the original real model/service path', () => withApplication(async h => {
  await h.standalone();
  assert.equal(h.details().length, 2, 'standalone page owns a fresh independent read');
  assert.equal(h.latest('app').state.currApp.ID, '35');
}));

for (const change of ['user', 'permissions', 'app']) {
  for (const failure of [false, true]) {
    test(`old ${failure ? 'failure' : 'success'} after ${change} change cannot update store, layout or current header`, () => withApplication(async h => {
      await h.mountPage();
      const oldRead = h.details()[0];
      if (change === 'app') await h.navigate({ app: '36' });
      else if (change === 'user') await h.patch({ user: { currentUser: { ...h.store.getState().user.currentUser, user_id: 'user-b' } } });
      else await h.patch({ teamControl: { ...h.store.getState().teamControl,
        currentTeamPermissionsInfo: { team: { revision: 9 } } } });
      assert.equal(h.details().length, 2);
      const current = h.details()[1];
      const fresh = { ...h.responseFor(current), bean: { ...h.responseFor(current).bean, group_name: 'fresh-generation' } };
      h.complete(current, fresh); await h.flush();
      const offset = h.writes.length, actions = h.actions.length;
      if (failure) h.fail(oldRead, { code: 404, status: 404 });
      else h.complete(oldRead, { ...h.responseFor(oldRead), bean: { ...h.responseFor(oldRead).bean, group_name: 'stale-generation' } });
      await h.flush();
      assert.equal(h.writes.length, offset, 'stale work must not even attempt setState');
      assert.equal(h.actions.slice(actions).filter(action => action.type === 'application/saveGroupDetail' || /router\//.test(action.type)).length, 0);
      assert.equal(h.warnings.length, 0);
      assert.equal(h.store.getState().application.groupDetail.group_name, 'fresh-generation');
      assert.equal(h.latest('TeamLayout').state.currentApp.group_name, 'fresh-generation');
      assert.equal(h.latest('app').state.currApp.group_name, 'fresh-generation');
    }, { holdDetail: true }));
  }
}

test('old error delivered before parent componentDidUpdate cannot clear UI, warn or redirect', () => withApplication(async h => {
  await h.mountPage();
  const oldRead = h.details()[0];
  let observed = false;
  h.beforeLayoutUpdate(layout => {
    if (observed || layout.props.currentUser.user_id !== 'user-b') return;
    observed = true;
    const writeOffset = h.writes.length, actionOffset = h.actions.length;
    h.fail(oldRead, { code: 404, status: 404 });
    assert.equal(h.writes.length, writeOffset, 'stale owner callback must guard current props before parent didUpdate');
    assert.equal(h.actions.slice(actionOffset).some(action => /router\//.test(action.type)), false);
    assert.equal(h.warnings.length, 0);
  });
  await h.patch({ user: { currentUser: { ...h.store.getState().user.currentUser, user_id: 'user-b' } } });
  assert.equal(observed, true);
  assert.equal(h.details().length, 2);
  h.complete(h.details()[1]); await h.flush();
  assert.equal(h.latest('app').state.currApp.ID, '35');
}, { holdDetail: true }));

test('successful edit, governance callback and component-create callback each force a fresh detail read', () => withApplication(async h => {
  await h.mountPage();
  const header = h.latest('app');
  header.handleEdit({ group_name: 'edited-name' }); await h.flush();
  assert.equal(h.details().length, 2, 'real edit success path must refresh the detail');
  header.setState({ customSwitch: true }); await h.flush();
  assert.equal(typeof h.viewCallbacks.governance, 'function');
  h.viewCallbacks.governance(); await h.flush();
  assert.equal(h.details().length, 3);
  header.setState({ addComponentOrAppDetail: 'addComponent' }); await h.flush();
  assert.equal(typeof h.viewCallbacks.componentCreated, 'function');
  h.viewCallbacks.componentCreated(); await h.flush();
  assert.equal(h.details().length, 4);
}));

test('same Layout warns once again after valid -> missing -> valid -> missing application navigation', () => withApplication(async h => {
  h.complete(h.details()[0]); await h.flush(); await h.mountPage();
  const layout = h.latest('TeamLayout');
  await h.navigate({ app: '36' });
  h.fail(h.details()[1], { code: 404, status: 404 }); await h.flush();
  assert.equal(h.warnings.length, 1);
  assert.equal(h.actions.filter(action => /router\/(push|replace)$/.test(action.type)).length, 1);
  await h.navigate({ app: '35' });
  h.complete(h.details()[2]); await h.flush();
  assert.equal(h.latest('TeamLayout'), layout, 'test must keep the original Layout instance');
  assert.equal(layout.missingResourceRedirected, false);
  await h.navigate({ app: '36' });
  h.fail(h.details()[3], { code: 404, status: 404 }); await h.flush();
  assert.equal(h.warnings.length, 2);
  assert.equal(h.actions.filter(action => /router\/(push|replace)$/.test(action.type)).length, 2);
  assert.equal(h.details().length, 4);
}, { holdDetail: true }));

test('non-Overview initial path retains the independent Layout detail request and later Overview starts its own visit', () => withApplication(async h => {
  assert.equal(h.details().length, 1);
  assert.equal(h.latest('TeamLayout').state.currentApp.ID, '35');
  await h.navigate({ app: '36' });
  assert.equal(h.details().length, 2);
  assert.equal(h.latest('TeamLayout').state.currentApp.ID, '36');
  await h.navigate({ route: 'overview', showPage: true });
  assert.equal(h.details().length, 3);
  assert.equal(h.latest('app').state.currApp.ID, '36');
}, { route: 'version' }));

test('changing raw empty/false refresh values invalidates once without altering their existing query semantics', () => withApplication(async h => {
  await h.mountPage();
  await h.navigate({ search: '?refresh=false' });
  assert.equal(h.details().length, 2);
  await h.navigate({ search: '?refresh=false&type=gateway' });
  assert.equal(h.details().length, 2);
  await h.navigate({ search: '?refresh=' });
  assert.equal(h.details().length, 3);
  await h.navigate({ search: '?type=gateway' });
  assert.equal(h.details().length, 3, 'empty and missing refresh retain their prior empty value interpretation');
}));

for (const change of ['permissions', 'region']) {
  test(`old ${change} scope error is rejected before parent componentDidUpdate`, () => withApplication(async h => {
    await h.mountPage();
    const oldRead = h.details()[0];
    let observed = false;
    h.beforeLayoutUpdate(layout => {
      const changed = change === 'permissions'
        ? layout.props.currentTeamPermissionsInfo.team.revision === 88
        : layout.props.match.params.regionName === 'other-region';
      if (observed || !changed) return;
      observed = true;
      const writeOffset = h.writes.length, actionOffset = h.actions.length;
      h.fail(oldRead, { code: 404, status: 404 });
      assert.equal(h.writes.length, writeOffset);
      assert.equal(h.actions.slice(actionOffset).some(action => /router\//.test(action.type)), false);
      assert.equal(h.warnings.length, 0);
    });
    if (change === 'permissions') await h.patch({ teamControl: { ...h.store.getState().teamControl,
      currentTeamPermissionsInfo: { team: { revision: 88 } } } });
    else await h.navigate({ region: 'other-region' });
    assert.equal(observed, true);
    assert.equal(h.details().length, 2);
    h.complete(h.details()[1]); await h.flush();
    assert.equal(h.latest('app').state.currApp.ID, '35');
  }, { holdDetail: true }));
}

test('old owner success delivered before parent componentDidUpdate cannot publish stale local UI', () => withApplication(async h => {
  await h.mountPage();
  const oldRead = h.details()[0];
  const oldOwnerAction = h.actions.find(action => action.type === 'application/fetchGroupDetail' && action.skipDetailDedup);
  assert(oldOwnerAction, 'observe the actual owner dispatch');
  let observed = false;
  h.beforeLayoutUpdate(layout => {
    if (observed || layout.props.currentUser.user_id !== 'user-b') return;
    observed = true;
    const offset = h.writes.length;
    oldOwnerAction.callback({ ...h.responseFor(oldRead), bean: { ...h.responseFor(oldRead).bean, group_name: 'stale-sync' } });
    assert.equal(h.writes.length, offset);
  });
  await h.patch({ user: { currentUser: { ...h.store.getState().user.currentUser, user_id: 'user-b' } } });
  assert.equal(observed, true);
  h.complete(h.details()[1]); await h.flush();
  const offset = h.writes.length, actionOffset = h.actions.length;
  h.complete(oldRead); await h.flush();
  assert.equal(h.writes.length, offset);
  assert.equal(h.actions.slice(actionOffset).some(action => action.type === 'application/saveGroupDetail'), false);
  assert.equal(h.latest('app').state.currApp.group_name, 'application-35');
}, { holdDetail: true }));

test('old component-list callback cannot setState after Overview unmount while the current callback still updates', () => withApplication(async h => {
  await h.mountPage();
  const oldOverview = h.latest('Overview');
  const oldRead = h.actions.find(action => action.type === 'application/fetchApps');
  await h.navigate({ app: '36' });
  const currentOverview = h.latest('Overview');
  assert.notEqual(currentOverview, oldOverview);
  const currentRead = h.actions.filter(action => action.type === 'application/fetchApps').at(-1);
  currentRead.callback({ status_code: 200, list: [{ service_alias: 'current-component' }] });
  assert.deepEqual(currentOverview.state.apps, [{ service_alias: 'current-component' }]);
  const offset = h.writes.length, reactErrors = [], originalError = console.error;
  console.error = (...values) => { reactErrors.push(values.join(' ')); originalError.apply(console, values); };
  try {
    oldRead.callback({ status_code: 200, list: [{ service_alias: 'obsolete-component' }] });
    await h.flush();
    assert.equal(h.writes.slice(offset).some(write => write.instance === oldOverview), false,
      'stale list success must not attempt any Overview state write');
    assert.equal(reactErrors.some(value => /state update on an unmounted component/i.test(value)), false);
    assert.deepEqual(currentOverview.state.apps, [{ service_alias: 'current-component' }]);
  } finally { console.error = originalError; }
}, { holdApps: true }));

test('old component-list 404 cannot redirect after Overview unmount while the mounted handler still works', () => withApplication(async h => {
  await h.mountPage();
  const oldRead = h.actions.find(action => action.type === 'application/fetchApps');
  await h.navigate({ app: '36' });
  const currentRead = h.actions.filter(action => action.type === 'application/fetchApps').at(-1);
  currentRead.handleError({ code: 404, status: 404 });
  assert.equal(h.actions.filter(action => /router\/(push|replace)$/.test(action.type)).length, 1);
  const offset = h.actions.length, warningOffset = h.warnings.length;
  oldRead.handleError({ code: 404, status: 404 }); await h.flush();
  assert.equal(h.actions.slice(offset).some(action => /router\/(push|replace)$/.test(action.type)), false,
    'stale list error must not redirect the replacement page');
  assert.equal(h.warnings.length, warningOffset);
}, { holdApps: true }));

test('component-list callbacks from an earlier scope cannot change the same mounted Overview', () => withApplication(async h => {
  await h.mountPage();
  const overview = h.latest('Overview');
  const oldRead = h.actions.find(action => action.type === 'application/fetchApps');
  await h.patch({ user: { currentUser: { ...h.store.getState().user.currentUser, user_id: 'user-b' } } });
  assert.equal(h.latest('Overview'), overview);
  const currentRead = h.actions.filter(action => action.type === 'application/fetchApps').at(-1);
  assert.notEqual(currentRead, oldRead);
  const currentHTTPReads = h.requests.filter(record => record.url.endsWith('/service/group'));
  assert.equal(currentHTTPReads.length, 2, 'the real scope update must automatically load the new component list once');
  h.complete(currentHTTPReads.at(-1), { status_code: 200, list: [{ service_alias: 'new-principal-component' }] });
  await h.flush();
  const offset = h.writes.length, actionOffset = h.actions.length;
  oldRead.callback({ status_code: 200, list: [{ service_alias: 'old-principal-component' }] });
  oldRead.handleError({ code: 404, status: 404 }); await h.flush();
  assert.equal(h.writes.slice(offset).some(write => write.instance === overview), false);
  assert.equal(h.actions.slice(actionOffset).some(action => /router\/(push|replace)$/.test(action.type)), false);
  assert.deepEqual(overview.state.apps, [{ service_alias: 'new-principal-component' }]);
  assert.deepEqual(h.store.getState().application.apps, [{ service_alias: 'new-principal-component' }]);
}, { holdApps: true }));

test('real late component-list HTTP cannot overwrite the replacement application.apps reducer state', () => withApplication(async h => {
  await h.mountPage();
  const oldHTTP = h.requests.find(record => record.url.endsWith('/service/group'));
  await h.navigate({ app: '36' });
  const currentHTTP = h.requests.filter(record => record.url.endsWith('/service/group')).at(-1);
  assert.notEqual(oldHTTP, currentHTTP);
  const fresh = [{ service_alias: 'current-36', status: 'running' }];
  h.complete(currentHTTP, { status_code: 200, list: fresh }); await h.flush();
  assert.deepEqual(h.store.getState().application.apps, fresh, 'current real effect must save the current list');
  const actionOffset = h.actions.length;
  h.complete(oldHTTP, { status_code: 200, list: [{ service_alias: 'obsolete-35', status: 'running' }] }); await h.flush();
  assert.deepEqual(h.store.getState().application.apps, fresh,
    'late old HTTP must be gated before the real effect saves application.apps');
  assert.equal(h.actions.slice(actionOffset).some(action => action.type === 'application/saveApps'), false);
  assert.deepEqual(h.latest('Overview').state.apps, fresh);
}, { holdApps: true }));

test('an exiting mounted Overview with old props cannot apply old callbacks after the global route changes', () => withApplication(async h => {
  await h.mountPage();
  const overview = h.latest('Overview');
  const oldRead = h.actions.find(action => action.type === 'application/fetchApps');
  // CSSTransition can retain this old tree for its 700 ms exit animation. Change
  // the browser's route without reconciling this tree to model that exact window.
  h.changeGlobalURL('36');
  assert.equal(h.latest('Overview'), overview);
  assert.equal(overview.props.match.params.appID, '35');
  assert.equal(overview._isMounted, true);
  const writeOffset = h.writes.length, actionOffset = h.actions.length;
  oldRead.callback({ status_code: 200, list: [{ service_alias: 'exiting-35' }] });
  oldRead.handleError({ code: 404, status: 404 }); await h.flush();
  assert.equal(h.writes.slice(writeOffset).some(write => write.instance === overview), false);
  assert.equal(h.actions.slice(actionOffset).some(action => /router\/(push|replace)$/.test(action.type)), false);
  assert.equal(h.warnings.length, 0);
}, { holdApps: true }));
