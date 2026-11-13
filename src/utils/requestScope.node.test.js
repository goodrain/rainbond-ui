const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test } = require('node:test');

// Reuse the existing real panel/model/service fixture. Only transport and
// observable browser/telemetry effects are doubled; request.js stays real.
const fixtureFile = path.resolve(__dirname, '../pages/Component/vmSnapshots.node.test.js');
const source = fs.readFileSync(fixtureFile, 'utf8');
const moduleValue = { exports: {} };
vm.runInNewContext(`${source.slice(0, source.indexOf("\ntest('"))}\nmodule.exports={harness,load,list,item};`, {
  module: moduleValue, exports: moduleValue.exports, require: createRequire(fixtureFile),
  __dirname: path.dirname(fixtureFile), __filename: fixtureFile
}, { filename: fixtureFile });
const { harness, load, list, item } = moduleValue.exports;

function deferred() {
  let resolve, reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
const failure = (code, status = 404) => ({ response: { status,
  data: { code, data: { bean: { service_team_name: 'target-team', service_region: 'target-region', name: 'market' } } } } });
const success = config => ({ status: 200, config, data: { code: 200, data: { bean: list([item('current-point')]).bean } } });
function client(transport, scope = { team: 'team', region: 'region', application: '42' }) {
  const events = { navigation: { href: '' }, actions: [], notices: [], modals: [], cookies: [], renewals: [], errors: [], viewed: [], starts: [], finishes: [], apiErrors: [] };
  const axios = config => transport(config);
  axios.defaults = {}; axios.isCancel = () => false;
  const result = load('utils/request.js', {
    antd: { notification: { warning: value => events.notices.push(value), error: value => events.notices.push(value) },
      Modal: { error: value => events.modals.push(value) } }, axios,
    '../utils/global': { getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region,
      getAppID: () => scope.application, replaceUrlTeam: team => `team:${team}`, replaceUrlRegion: region => `region:${region}` },
    './cookie': { get: () => undefined, setGuide: (...args) => events.cookies.push(args) },
    './error': error => events.apiErrors.push(error), './token': { updateRenewedTokenFromResponse: value => events.renewals.push(value) },
    '@/utils/intl': { formatMessage: ({ id }) => id },
    umi: { history: { push: value => events.actions.push(value) }, getDvaApp: () => ({ _store: { dispatch: value => events.actions.push(value) } }) },
    '../sentry': { captureRequestError: (...args) => events.errors.push(args), startSlowRequestTracking: value => { events.starts.push(value); return {}; },
      finishSlowRequestTracking: (...args) => events.finishes.push(args) },
    '../posthog': { captureErrorViewed: (...args) => events.viewed.push(args) },
    './requestSlowTelemetry': require('./requestSlowTelemetry'), './marketInstallPreflight': { renderPreflightContent: () => 'preflight' }
  }, { location: events.navigation });
  return { request: result.default, events };
}
function noOldErrorEffects(events) {
  assert.equal(events.navigation.href, '');
  assert.equal(events.notices.length, 0); assert.equal(events.modals.length, 0);
  assert.equal(events.cookies.length, 0); assert.equal(events.errors.length, 0);
  assert.equal(events.viewed.length, 0); assert.equal(events.apiErrors.length, 0);
}

test('optional scope is fail-closed before transport, loading and telemetry; unscoped calls remain enabled', async () => {
  for (const shouldApply of [null, false, () => false, () => { throw new Error('invalid scope'); }]) {
    let calls = 0;
    const c = client(config => { calls += 1; return Promise.resolve(success(config)); });
    let callbacks = 0;
    assert.equal(await c.request('/scope', { shouldApply, handleError: () => { callbacks += 1; } }), undefined);
    assert.equal(calls, 0); assert.equal(callbacks, 0); assert.equal(c.events.actions.length, 0);
    assert.equal(c.events.starts.length, 0); noOldErrorEffects(c.events);
  }
  const c = client(config => Promise.resolve(success(config)));
  const value = await c.request('/legacy');
  assert.equal(value.status_code, 200); assert.equal(c.events.renewals.length, 1);
});

test('a stale rejected request cannot run legacy navigation, auth, quota, modal, notice or error callbacks', async () => {
  for (const code of [10400, 10403, 10404, 10405, 10406, 10407, 10408, 10409, 10410, 10412, 404]) {
    let active = true, callbacks = 0;
    const old = deferred(), c = client(() => old.promise);
    const pending = c.request('/scope', { shouldApply: () => active, showLoading: false, showMessage: true,
      handleError: () => { callbacks += 1; } });
    active = false; old.reject(failure(code));
    assert.equal(await pending, undefined); assert.equal(callbacks, 0);
    noOldErrorEffects(c.events); assert.equal(c.events.actions.length, 0);
    assert.equal(c.events.finishes.length, 1); assert.equal(c.events.finishes[0][1].cancelled, true);
  }
});

test('stale fulfilled HTTP errors are discarded before checkStatus warnings and stale successes cannot renew session data', async () => {
  for (const status of [200, 403, 503]) {
    let active = true, config;
    const old = deferred(), c = client(value => { config = value; return old.promise; });
    const pending = c.request('/scope', { shouldApply: () => active, showLoading: false });
    active = false; old.resolve({ ...success(config), status });
    assert.equal(await pending, undefined); noOldErrorEffects(c.events);
    assert.equal(c.events.renewals.length, 0); assert.equal(c.events.actions.length, 0);
  }
});

test('discarded scoped work balances its loader and later current requests still finish normally', async () => {
  let active = true, first = true;
  const old = deferred(), c = client(config => first ? (first = false, old.promise) : Promise.resolve(success(config)));
  const pending = c.request('/old', { shouldApply: () => active });
  active = false; old.reject(failure(10405)); await pending;
  assert.deepEqual(c.events.actions.map(value => value.type), ['global/showLoading', 'global/hiddenLoading']);
  active = true;
  assert.equal((await c.request('/current', { shouldApply: () => active })).status_code, 200);
  assert.deepEqual(c.events.actions.map(value => value.type), ['global/showLoading', 'global/hiddenLoading', 'global/showLoading', 'global/hiddenLoading']);
  assert.equal(c.events.renewals.length, 1);
});

test('current scoped and legacy calls preserve team/region redirects, login, activation and enterprise auth policy', async () => {
  for (const scoped of [false, true]) {
    for (const [code, expected] of [[10403, 'team:target-team'], [10404, 'region:target-region']]) {
      const c = client(() => Promise.reject(failure(code)));
      await c.request('/current', { ...(scoped ? { shouldApply: () => true } : {}), showLoading: false, showMessage: false });
      assert.equal(c.events.navigation.href, expected);
    }
    for (const [code, action] of [[10405, 'global/showNeedLogin'], [10400, 'global/setNouse'], [10407, 'global/showAuthCompany']]) {
      const c = client(() => Promise.reject(failure(code))); let callbacks = 0;
      await c.request('/current', { ...(scoped ? { shouldApply: () => true } : {}), showLoading: false, showMessage: false,
        handleError: () => { callbacks += 1; } });
      assert.ok(c.events.actions.some(value => value.type === action));
      assert.equal(callbacks, code === 10405 ? 1 : 0);
    }
  }
});

test('current standard failures and protected error paths retain existing callback and sanitization behavior', async () => {
  const error = failure(403, 403), c = client(() => Promise.reject(error));
  let received;
  await c.request('/current', { shouldApply: () => true, showLoading: false, handleError: value => { received = value; } });
  assert.equal(received, error); assert.equal(c.events.errors.length, 1); assert.equal(c.events.viewed.length, 1);
  const protectedClient = client(() => Promise.reject(error));
  await protectedClient.request('/protected', { shouldApply: () => true, sensitiveError: true, showLoading: false,
    handleError: value => { received = value; } });
  assert.equal(received.name, 'SensitiveRequestError'); assert.equal(received.response, undefined);
  assert.equal(protectedClient.events.errors.length, 0); assert.equal(protectedClient.events.navigation.href, '');
  const checked = client(config => Promise.resolve({ ...success(config), status: 403 }));
  await checked.request('/current-status', { shouldApply: () => true, showLoading: false,
    handleError: value => { received = value; } });
  assert.equal(checked.events.notices.length, 1, 'current responses must still run the shared checkStatus warning');
  assert.equal(received.response.status, 403);
  const legacy = client(() => Promise.reject(error));
  await assert.rejects(legacy.request('/legacy-error', { noModels: true, showLoading: false }), value => value === error);
  assert.equal(legacy.events.apiErrors.length, 1, 'unscoped default error policy is retained');
});

test('VM switch, hidden tab, disabled polling and unmount suppress late shared-request auth effects and allow fresh reads', async () => {
  for (const transition of ['alias', 'application', 'serviceId', 'hide', 'disable', 'unmount']) {
    const h = harness(), old = deferred(); let first = true;
    const c = client(config => first ? (first = false, old.promise) : Promise.resolve(success(config)), h.scope);
    h.request = c.request; h.panel.componentDidMount(); const oldRead = h.pending[0];
    if (['alias', 'application', 'serviceId'].includes(transition)) {
      h.scope[transition] = `new-${transition}`; await h.update({ context: { ...h.scope } });
    } else if (transition === 'hide') h.hide(true);
    else if (transition === 'disable') {
      const previous = h.panel.props;
      h.panel.props = { ...previous, pollingEnabled: false };
      h.panel.componentDidUpdate(previous);
    }
    else h.panel.componentWillUnmount();
    old.reject(failure(10405)); await oldRead;
    noOldErrorEffects(c.events); assert.equal(c.events.actions.length, 0);
    if (transition === 'hide') { h.hide(false); await h.settle(); }
    if (transition === 'disable') await h.update({ pollingEnabled: true });
    if (transition !== 'unmount') {
      assert.equal(h.panel.state.items[0].snapshot_name, 'current-point');
      assert.equal(h.timers.size, 1); h.panel.componentWillUnmount();
    } else assert.equal(h.timers.size, 0);
  }
});
