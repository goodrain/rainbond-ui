/* Production Header + createApp effect/service + request.js; only axios and
 * unrelated UI/analytics dependencies are fixtures. No login data is used. */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { runSaga } = require('redux-saga');
const effects = require('redux-saga/effects');
const babel = require('@umijs/deps/compiled/babel/core');
const React = require('react');
const repo = path.resolve(__dirname, '../../../..');
const sources = {
  header: 'src/components/SlidePanel/components/app.js', request: 'src/utils/request.js',
  service: 'src/services/createApp.js', model: 'src/models/createApp.js'
};
const compiled = Object.fromEntries(Object.entries(sources).map(([name, file]) => [name,
  babel.transformSync(fs.readFileSync(path.join(repo, file), 'utf8'), {
    filename: path.join(repo, file), babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
      [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
  }).code
]));

async function withCommandFixture(verify, { owned = true, billing = false, fakeTimers = false } = {}) {
  const route = { team: 'old-team', region: 'old-region', id: '35' };
  const wire = [], actions = [], writes = [], errors = [], tasks = new Set(), scheduled = new Set();
  const originalDocument = Object.getOwnPropertyDescriptor(global, 'document');
  const originalSetTimeout = global.setTimeout, originalClearTimeout = global.clearTimeout;
  Object.defineProperty(global, 'document', { configurable: true, writable: true,
    value: { hidden: false, addEventListener() {}, removeEventListener() {} } });
  if (fakeTimers) {
    global.setTimeout = callback => { const timer = { callback }; scheduled.add(timer); return timer; };
    global.clearTimeout = timer => scheduled.delete(timer);
  }
  try {
    const box = () => null;
    const util = { getCurrTeamName: () => route.team, getCurrRegionName: () => route.region, getAppID: () => route.id };
    const axios = config => {
      const record = { config };
      wire.push(record);
      if (config.url.endsWith('/third_party')) return new Promise(resolve => { record.resolve = resolve; });
      return Promise.resolve({ status: 200, config, data: { code: 200, data: { bean: {} } } });
    };
    axios.defaults = {};
    axios.isCancel = () => false;
    const fixtures = {
      react: React, dva: { connect: () => Component => Component },
      antd: { notification: { warning() {}, success() {} }, Modal: {} },
      '@/utils/global': util, '../utils/global': util,
      '@/utils/intl': { formatMessage: value => value.id },
      './componentViewPerformance': { shouldLoadStorageUsage: () => billing },
      axios, './cookie': { get: () => undefined }, './error': () => {},
      './token': { updateRenewedTokenFromResponse() {} },
      umi: { history: {}, getDvaApp: () => ({ _store: { dispatch() {} } }) },
      '../sentry': { captureRequestError() {}, finishSlowRequestTracking() {}, startSlowRequestTracking() {} },
      '../posthog': { captureErrorViewed() {}, captureAppOperation() {}, captureMarketInstall() {} },
      './requestSlowTelemetry': require('../../../utils/requestSlowTelemetry'),
      './marketInstallPreflight': { renderPreflightContent() {} },
      '../../config/api.config': { baseUrl: '' },
      '../utils/sourceBuildPayload': require('../../../utils/sourceBuildPayload')
    };
    const load = (name, overrides = {}) => {
      const module = { exports: {} };
      new Function('module', 'exports', 'require', compiled[name])(module, module.exports, id => {
        if (Object.prototype.hasOwnProperty.call(overrides, id)) return overrides[id];
        return Object.prototype.hasOwnProperty.call(fixtures, id) ? fixtures[id] : box;
      });
      return module.exports;
    };
    const request = load('request').default;
    const service = load('service', { '../utils/request': request });
    const model = load('model', { '../services/createApp': service }).default;
    const Header = load('header', { '../../../services/createApp': service }).default;
    const dispatch = action => {
      actions.push(action);
      const [namespace, name] = action.type.split('/');
      if (namespace !== 'createApp' || !model.effects[name]) return Promise.resolve();
      const task = runSaga({ dispatch, onError: error => errors.push(error) }, model.effects[name], action, effects);
      tasks.add(task);
      task.toPromise().then(() => tasks.delete(task), () => tasks.delete(task));
      return task.toPromise();
    };
    const header = new Header({ dispatch, applicationRoute: { teamName: route.team, regionName: route.region, appID: route.id },
      ...(owned ? { initialDetailLoader() {}, initialDetailScope: 'owned-initial' } : {}), pluginsList: [] });
    header.setState = (update, callback) => {
      writes.push(update); Object.assign(header.state, update); if (callback) callback();
    };
    header.componentMounted = true;
    header.detailReadyIdentity = JSON.stringify(header.getApplicationReadSnapshot());
    header.headerReadIdentity = header.detailReadyIdentity;
    const flush = () => new Promise(resolve => originalSetTimeout(resolve, 10));
    const completeCreate = record => record.resolve({ status: 200, config: record.config,
      data: { code: 200, data: { bean: { service_alias: 'created-component' } } } });
    await verify({ header, route, actions, wire, writes, errors, service, flush, completeCreate, scheduled });
    assert.deepEqual(errors, []);
    header.componentWillUnmount();
  } finally {
    for (const task of tasks) task.cancel();
    global.setTimeout = originalSetTimeout; global.clearTimeout = originalClearTimeout;
    if (originalDocument) Object.defineProperty(global, 'document', originalDocument); else delete global.document;
  }
}

for (const staticMode of [true, false]) {
  for (const departure of ['navigation', 'unmount']) {
    test(`valid ${staticMode ? 'static' : 'kubernetes'} create finishes captured build after ${departure}`, () => withCommandFixture(async h => {
      h.header.getOperator(false);
      h.actions.find(action => action.type === 'application/getOperator').callback({ status_code: 200,
        list: { service: [{ name: 'discovered', static: staticMode, address: ['fixture-address'], namespace: 'demo', service: 'discovered' }] } });
      assert.equal(h.wire.length, 1, 'a valid command actually reached third_party axios transport');
      const create = h.wire[0];
      assert.equal(create.config.url, '/console/teams/old-team/apps/third_party');
      Object.assign(h.route, { team: 'new-team', region: 'new-region', id: '36' });
      if (departure === 'unmount') h.header.componentWillUnmount();
      const writeOffset = h.writes.length;
      h.completeCreate(create); await h.flush();
      const builds = h.wire.filter(record => record.config.url.endsWith('/build'));
      assert.equal(builds.length, 1, 'a started valid command must finish even after the view leaves');
      assert.equal(builds[0].config.url, '/console/teams/old-team/apps/created-component/build');
      for (const record of [create, builds[0]]) {
        assert.equal(record.config.headers.X_TEAM_NAME, 'old-team');
        assert.equal(record.config.headers.X_REGION_NAME, 'old-region');
        assert.equal(record.config.data.region_name, 'old-region');
      }
      assert.equal(h.writes.length, writeOffset, 'command continuation must not update the old UI');
    }));
  }
  test(`old ${staticMode ? 'static' : 'kubernetes'} operator response after leaving starts no command`, () => withCommandFixture(async h => {
    h.header.getOperator(false);
    const read = h.actions.find(action => action.type === 'application/getOperator');
    Object.assign(h.route, { team: 'new-team', region: 'new-region', id: '36' });
    read.callback({ status_code: 200, list: { service: [{ name: 'obsolete', static: staticMode,
      address: ['fixture-address'], namespace: 'demo', service: 'obsolete' }] } });
    await h.flush();
    assert.equal(h.wire.length, 0);
    assert.equal(h.actions.some(action => action.type.startsWith('createApp/')), false);
  }));
}

test('real buildApp and request preserve an explicit captured team/region after route changes', () => withCommandFixture(async h => {
  Object.assign(h.route, { team: 'new-team', region: 'new-region', id: '36' });
  await h.service.buildApp({ team_name: 'old-team', region_name: 'old-region', app_alias: 'created-component', is_deploy: true });
  assert.equal(h.wire[0].config.headers.X_TEAM_NAME, 'old-team');
  assert.equal(h.wire[0].config.headers.X_REGION_NAME, 'old-region');
}));

test('buildApp without an explicit region retains the old payload and current request defaults', () => withCommandFixture(async h => {
  const body = Object.freeze({ team_name: 'old-team', app_alias: 'component', is_deploy: false,
    nodejs_type: 'npm', nodejs_dependency: 'build' });
  await h.service.buildApp(body);
  assert.deepEqual(h.wire[0].config.data, { is_deploy: false, nodejs_type: 'npm', nodejs_dependency: 'build' });
  assert.equal(h.wire[0].config.headers.X_TEAM_NAME, 'old-team');
  assert.equal(h.wire[0].config.headers.X_REGION_NAME, 'old-region');
}));

for (const change of ['app', 'region']) {
  test(`unowned same Header instance ${change} change restarts legacy parallel reads and actual timers`, () => withCommandFixture(async h => {
    h.header.componentDidMount();
    const firstStatus = h.actions.find(action => action.type === 'application/fetchAppDetailState');
    const firstOperator = h.actions.find(action => action.type === 'application/getOperator');
    firstStatus.callback({ status_code: 200, list: { status: 'RUNNING' } });
    firstOperator.callback({ status_code: 200, list: { service: [] } });
    assert.equal(h.scheduled.size, 2);
    const previous = h.header.props;
    if (change === 'app') h.route.id = '36'; else h.route.region = 'new-region';
    h.header.props = { ...previous, applicationRoute: { teamName: h.route.team, regionName: h.route.region, appID: h.route.id } };
    h.header.componentDidUpdate(previous);
    const allStatus = h.actions.filter(action => action.type === 'application/fetchAppDetailState');
    const allOperator = h.actions.filter(action => action.type === 'application/getOperator');
    assert.equal(allStatus.length, 2, 'legacy current route starts status without waiting for detail');
    assert.equal(allOperator.length, 2, 'legacy current route starts operator without waiting for detail');
    assert.equal(h.actions.filter(action => action.type === 'application/fetchToupgrade').length, 2);
    assert.equal(h.actions.filter(action => action.type === 'global/fetchStorageUsed').length, 2);
    allStatus[1].callback({ status_code: 200, list: { status: 'RUNNING' } });
    allOperator[1].callback({ status_code: 200, list: { service: [] } });
    assert.equal(h.scheduled.size, 2, 'two active timers must exist, not merely stale truthy fields');
  }, { owned: false, billing: true, fakeTimers: true }));
}
