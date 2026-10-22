/*
 * Real React reconciliation + the production connected Group Overview/AppHeader,
 * application generators and services. Only visual children and the final HTTP
 * boundary are fixtures. This guards the keyed subtree, not a copied lifecycle.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const { runSaga } = require('redux-saga');
const sagaEffects = require('redux-saga/effects');

const repo = path.resolve(__dirname, '../../..');
const babel = require('@umijs/deps/compiled/babel/core');
const paths = {
  overview: 'src/pages/Group/Overview.js',
  header: 'src/components/SlidePanel/components/app.js',
  shape: 'src/pages/Group/AppShape.js',
  model: 'src/models/application.js',
  service: 'src/services/application.js',
  global: 'src/utils/global.js'
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

async function withOverview(initialSearch, verify, { holdReads = false } = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1/' });
  const globals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    MessageChannel: undefined, requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout };
  Object.assign(dom.window, { requestAnimationFrame: globals.requestAnimationFrame, cancelAnimationFrame: globals.cancelAnimationFrame });
  const previous = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  Object.entries(globals).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
  const tasks = new Set(), requests = [], errors = [], topologies = [], actions = [], headers = [], writes = [], warnings = [];
  let ReactDOM, currentApp = '35', search = initialSearch, store;
  try {
    const React = require('react');
    ReactDOM = require('react-dom');
    const dva = require('dva');
    const redux5 = require(require.resolve('react-redux', { paths: [require.resolve('dva')] }));
    assert.equal(dva.connect, redux5.connect);
    const { createStore, applyMiddleware } = require('redux');
    const box = () => null;
    box.Item = box.Group = box.SubMenu = box;
    class TopologyFixture extends React.Component {
      componentDidMount() { topologies.push({ event: 'mount', app: this.props.group_id }); }
      componentWillUnmount() { topologies.push({ event: 'unmount', app: this.props.group_id }); }
      render() { return null; }
    }
    const roleUtil = { queryPermissionsInfo: () => ({ isAccess: true }), queryTeamOrAppPermissionsInfo: () => ({}) };
    const fixtures = {
      react: React, dva: { ...dva, connect: (...args) => Component => {
        if (Component.name === 'app') {
          const mounted = Component.prototype.componentDidMount;
          Component.prototype.componentDidMount = function observeHeaderMount() {
            headers.push(this);
            const setState = this.setState;
            this.setState = function observeStateWrite(update, callback) {
              writes.push({ header: this, mounted: this.componentMounted, update });
              return setState.call(this, update, callback);
            };
            return mounted.call(this);
          };
        }
        return dva.connect(...args)(Component);
      } }, 'dva/router': { routerRedux: { push: payload => ({ type: 'router/push', payload }),
        replace: payload => ({ type: 'router/replace', payload }) }, Redirect: box },
      antd: new Proxy({}, { get: (target, key) => key === 'notification'
        ? { warning: value => warnings.push(value), success() {} } : box }),
      umi: { FormattedMessage: box }, '@/utils/intl': { formatMessage: value => value.id },
      '@/utils/newRole': roleUtil, '@/utils/rainbond': { handleNewbie: () => false },
      '@/utils/pageHeaderSvg': { getSvg: () => null },
      moment: require('moment'),
      '../../utils/missingResourceHelpers': require('../../utils/missingResourceHelpers'),
      './componentViewPerformance': require('../../components/SlidePanel/components/componentViewPerformance')
    };
    const evaluate = (key, imports = {}) => {
      const module = { exports: {} };
      new Function('module', 'exports', 'require', compiled[key])(module, module.exports, name => {
        if (Object.prototype.hasOwnProperty.call(imports, name)) return imports[name];
        if (Object.prototype.hasOwnProperty.call(fixtures, name)) return fixtures[name];
        if (/\.(less|svg)$/.test(name)) return {};
        return box;
      });
      return module.exports;
    };
    const globalUtil = evaluate('global').default;
    fixtures['@/utils/global'] = globalUtil;
    const observed = url => /\/(status|operator-managed|upgradable_num)$/.test(url);
    const request = (url, options = {}) => {
      const record = { url, options, app: currentApp };
      requests.push(record);
      if (observed(url) || (holdReads && !url.endsWith('/service/group'))) {
        return new Promise(resolve => { record.resolve = resolve; });
      }
      if (url.endsWith('/service/group')) return Promise.resolve({ status_code: 200, list: [] });
      return Promise.resolve({ status_code: 200, bean: { ID: currentApp, group_name: 'fixture-app' } });
    };
    const services = evaluate('service', { '../../config/api.config': { baseUrl: '' }, '../utils/request': request });
    const model = evaluate('model', { '../services/application': services }).default;
    const initial = { application: { ...model.state }, teamControl: { currentTeamPermissionsInfo: { team: {} }, pluginsList: [] },
      user: { currentUser: {} }, enterprise: {}, global: { collapsed: false, novices: {}, rainbondInfo: {} }, loading: { effects: {} } };
    const reducer = (state = initial, action) => {
      const [namespace, name] = action.type.split('/');
      return namespace === 'application' && model.reducers[name]
        ? { ...state, application: model.reducers[name](state.application, action) } : state;
    };
    const middleware = () => next => action => {
      actions.push(action);
      const [namespace, name] = action.type.split('/');
      if (namespace !== 'application' || !model.effects[name]) return next(action);
      const task = runSaga({ dispatch: value => store.dispatch({ ...value,
        type: value.type.includes('/') ? value.type : `application/${value.type}` }), getState: store.getState,
      onError: error => errors.push(error) }, model.effects[name], action, sagaEffects);
      tasks.add(task);
      task.toPromise().then(() => tasks.delete(task), () => tasks.delete(task));
      return task.toPromise();
    };
    store = createStore(reducer, applyMiddleware(middleware));
    const AppHeader = evaluate('header').default;
    const AppShape = evaluate('shape', { '../../components/Topological': TopologyFixture }).default;
    const Overview = evaluate('overview', {
      '@/components/SlidePanel/components/app': AppHeader, './AppShape': AppShape
    }).default;
    const container = dom.window.document.getElementById('root');
    const flush = async () => {
      for (let index = 0; index < 5; index += 1) await new Promise(resolve => setImmediate(resolve));
    };
    const mount = () => {
      const pathname = `/team/test-team/region/test-region/apps/${currentApp}/overview`;
      dom.window.history.replaceState(null, '', `/#${pathname}${search}`);
      // TeamLayout's route transition uses pathname as its boundary key. Query
      // changes retain the page; a different application mounts a new page.
      const child = React.createElement(Overview, { key: pathname,
        match: { params: { teamName: 'test-team', regionName: 'test-region', appID: currentApp } },
        location: { pathname, search } });
      ReactDOM.render(React.createElement(redux5.Provider, { store }, child), container);
    };
    const counts = () => Object.fromEntries(['status', 'operator-managed', 'upgradable_num'].map(suffix => [suffix,
      requests.filter(record => record.url.endsWith(`/${suffix}`)).length]));
    const complete = () => requests.filter(record => record.resolve).forEach(record => {
      const resolve = record.resolve; delete record.resolve;
      resolve(record.url.endsWith('/operator-managed') ? { status_code: 200, list: { service: [] } }
        : record.url.endsWith('/upgradable_num') ? { status_code: 200, bean: { upgradable_num: 0 } }
          : record.url.endsWith('/status') ? { status_code: 200, list: { status: 'RUNNING', memory: 0 } }
            : { status_code: 200, bean: { ID: record.app, group_name: 'fixture-app' } });
    });
    mount(); await flush();
    await verify({ requests, errors, topologies, actions, headers, writes, warnings, counts, complete, flush,
      navigate: async (nextSearch, app = currentApp) => { search = nextSearch; currentApp = app; mount(); await flush(); },
      unmount: () => ReactDOM.unmountComponentAtNode(container) });
    assert.deepEqual(errors, []);
  } finally {
    if (ReactDOM) ReactDOM.unmountComponentAtNode(dom.window.document.getElementById('root'));
    tasks.forEach(task => task.cancel());
    dom.window.close();
    Object.keys(globals).forEach(key => { if (previous[key]) Object.defineProperty(global, key, previous[key]); else delete global[key]; });
  }
}

const expected = count => ({ status: count, 'operator-managed': count, upgradable_num: count });

for (const search of ['', '?refresh=', '?refresh=false', '?refresh=first-token']) {
  test(`cold Group overview ${search || '(no query)'} initializes one AppHeader request set`,
    () => withOverview(search, async h => {
      assert.deepEqual(h.counts(), expected(1));
      assert.equal(h.topologies.filter(event => event.event === 'mount').length, 1);
      h.complete(); await h.flush();
      assert.deepEqual(h.counts(), expected(1));
    }));
}

test('drawer query changes retain the header; an explicit refresh token remounts it once',
  () => withOverview('', async h => {
    assert.deepEqual(h.counts(), expected(1));
    await h.navigate('?type=components&componentID=fixture-component&tab=overview');
    assert.deepEqual(h.counts(), expected(1));
    await h.navigate('?type=gateway');
    assert.deepEqual(h.counts(), expected(1));
    assert.deepEqual(h.topologies, [{ event: 'mount', app: '35' }]);
    await h.navigate('?refresh=operation-success');
    assert.deepEqual(h.counts(), expected(2));
    await h.navigate('?refresh=operation-success&type=components&componentID=fixture-component');
    assert.deepEqual(h.counts(), expected(2));
    await h.navigate('?refresh=another-operation');
    assert.deepEqual(h.counts(), expected(3));
    assert.deepEqual(h.topologies.map(event => event.event), ['mount', 'unmount', 'mount', 'unmount', 'mount']);
    h.complete(); await h.flush();
    assert.deepEqual(h.counts(), expected(3));
  }));

test('a different application or a genuine page reentry reads fresh without a response cache',
  () => withOverview('?refresh=initial-token', async h => {
    assert.deepEqual(h.counts(), expected(1));
    await h.navigate('?refresh=initial-token', '36');
    assert.deepEqual(h.counts(), expected(2));
    const group36 = h.requests.filter(record => record.app === '36' && /\/(status|operator-managed|upgradable_num)$/.test(record.url));
    assert.equal(group36.length, 3);
    assert.equal(group36.find(record => record.url.endsWith('/operator-managed')).options.params.group_id, '36');
    assert(group36.filter(record => !record.url.endsWith('/operator-managed')).every(record => record.url.includes('/groups/36/')));
    h.unmount(); await h.navigate('?refresh=initial-token', '35');
    assert.deepEqual(h.counts(), expected(3));
  }));

test('late read successes never call setState on an unmounted header while its replacement still updates',
  () => withOverview('', async h => {
    const oldHeader = h.headers[0];
    oldHeader.handleGroupAllResource(); oldHeader.getStorageUsed(); oldHeader.loadLinks('fixture-component');
    await h.flush();
    const oldStorage = h.actions.find(action => action.type === 'global/fetchStorageUsed');
    const oldLinks = h.actions.find(action => action.type === 'global/queryLinks');
    await h.navigate('?refresh=explicit-operation');
    const newHeader = h.headers[1];
    assert.equal(oldHeader.componentMounted, false);
    const offset = h.writes.length;
    h.complete();
    oldStorage.callback({ bean: { used_storage: { value: 5, unit: 'MB' } } });
    oldLinks.callback({ status_code: 200, list: ['obsolete-link'] });
    await h.flush();
    assert.equal(h.writes.slice(offset).some(write => write.header === oldHeader), false,
      'the callback must not even attempt setState after unmount');
    assert.equal(newHeader.state.currApp.ID, '35');
    assert.equal(newHeader.state.upgradableNumLoading, false);
    assert.equal(newHeader.state.appStatusConfig, true);
    newHeader.handleGroupAllResource(); newHeader.getStorageUsed(); newHeader.loadLinks('fixture-component');
    h.complete();
    h.actions.filter(action => action.type === 'global/fetchStorageUsed').at(-1)
      .callback({ bean: { used_storage: { value: 8, unit: 'MB' } } });
    h.actions.filter(action => action.type === 'global/queryLinks').at(-1)
      .callback({ status_code: 200, list: ['current-link'] });
    await h.flush();
    assert.equal(newHeader.state.resourceList.ID, '35');
    assert.deepEqual(newHeader.state.storageUsed, { value: 8, unit: 'MB' });
    assert.deepEqual(newHeader.state.linkList, ['current-link']);
  }, { holdReads: true }));

test('late read errors cannot redirect or notify after unmount; mounted error handling is preserved',
  () => withOverview('', async h => {
    const header = h.headers[0];
    header.loadLinks('fixture-component');
    const detail = h.actions.find(action => action.type === 'application/fetchGroupDetail' && action.callback);
    const links = h.actions.find(action => action.type === 'global/queryLinks');
    detail.handleError({ code: 404 });
    links.handleError({ data: { msg_show: 'current read failed' } });
    assert.equal(h.actions.filter(action => action.type === 'router/push').length, 1);
    assert.equal(h.warnings.length, 1);
    h.unmount();
    const offset = h.writes.length;
    detail.handleError({ code: 404 });
    links.handleError({ data: { msg_show: 'obsolete read failed' } });
    h.complete(); await h.flush();
    assert.equal(h.writes.length, offset);
    assert.equal(h.actions.filter(action => action.type === 'router/push').length, 1);
    assert.equal(h.warnings.length, 1);
  }, { holdReads: true }));
