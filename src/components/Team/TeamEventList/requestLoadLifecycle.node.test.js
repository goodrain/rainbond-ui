const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const pollingHelpers = require('../../../pages/Component/componentPolling');
const helpers = require('./helpers');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
const methods = declaration.body.body.filter(node => !['render', 'renderActivities'].includes(node.key.name)).map(node => source.slice(node.start, node.end)).join('\n');
function harness({ billing = false, permission = false } = {}) {
  const requests = [];
  const timers = new Map();
  const errors = [];
  const scope = { team: 'team-a', region: 'region-a' };
  let serial = 0;
  class PureComponent {
    constructor(props) { this.props = props; }
    setState(update, callback) { this.state = { ...this.state, ...update }; if (callback) callback(); }
  }
  const dependencies = {
    PureComponent, ...helpers, ...pollingHelpers,
    newRole: { queryPermissionsInfo: team => ({ isAccess: !!(team && team.allowed) }) },
    PluginUtil: { isInstallPlugin: list => (list || []).some(plugin => plugin.name === 'rainbond-bill') },
    globalUtil: { getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region },
    handleAPIError: error => errors.push(error),
    setTimeout: (callback, delay) => { const id = ++serial; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id)
  };
  const Page = new Function(...Object.keys(dependencies), `return class extends PureComponent { ${methods} };`)(...Object.values(dependencies));
  const page = new Page({
    dispatch: action => requests.push(action), pluginsList: billing ? [{ name: 'rainbond-bill' }] : [],
    currentTeamPermissionsInfo: { team: { allowed: permission } }
  });
  page.componentDidMount();
  return {
    page, scope, requests, timers, errors,
    matching(type) { return requests.filter(action => action.type === type); },
    update(props) {
      const previous = page.props; page.props = { ...page.props, ...props };
      page.componentDidUpdate(previous);
    },
    fire(delay) {
      const entry = [...timers].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `expected ${delay}ms retry`);
      timers.delete(entry[0]); entry[1].callback();
    }
  };
}
const overview = { bean: { region_health: true, team_id: 'team-id-a', disk_usage: 5 } };
{
  const h = harness();
  h.matching('index/fetchOverview')[0].callback(overview);
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, 0, 'no billing plugin or overview permission must cause zero storage reads');
}
for (const [billing, permission, healthy, teamId, expected] of [
  [false, true, true, 'team-id-a', 0],
  [true, false, true, 'team-id-a', 0],
  [true, true, false, 'team-id-a', 0],
  [true, true, true, '', 0],
  [true, true, true, 'team-id-a', 1]
]) {
  const h = harness({ billing, permission });
  h.matching('index/fetchOverview')[0].callback({ bean: { region_health: healthy, team_id: teamId } });
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, expected);
}
const billingProps = { pluginsList: [{ name: 'rainbond-bill' }] };
const permissionProps = { currentTeamPermissionsInfo: { team: { allowed: true } } };
for (const order of [
  ['overview', 'plugin', 'permission'], ['overview', 'permission', 'plugin'],
  ['plugin', 'overview', 'permission'], ['permission', 'overview', 'plugin'],
  ['plugin', 'permission', 'overview'], ['permission', 'plugin', 'overview']
]) {
  const h = harness();
  for (const event of order) {
    if (event === 'overview') h.matching('index/fetchOverview')[0].callback(overview);
    if (event === 'plugin') h.update(billingProps);
    if (event === 'permission') h.update(permissionProps);
  }
  h.update({}); h.update({});
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, 1, `${order} must request once when all requirements arrive`);
  const request = h.matching('global/fetchStorageUsed')[0];
  assert.deepStrictEqual(request.payload, { tenant_id: 'team-id-a', region_name: 'region-a' });
  request.callback({ bean: { used_storage: { value: 2, unit: 'GB' } } });
  h.update({}); h.update(permissionProps); h.update(billingProps);
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, 1, 'loaded same-scope storage must not be re-read on renders');
  assert.deepStrictEqual(h.page.state.storageUsed, { value: 2, unit: 'GB' });
  assert.strictEqual(h.page.state.teamOverviewPermission.isAccess, true, 'late permission must update rendering as well as request eligibility');
}
for (const change of ['permission', 'plugin', 'scope', 'unmount']) {
  const h = harness({ billing: true, permission: true });
  h.matching('index/fetchOverview')[0].callback(overview);
  const stale = h.matching('global/fetchStorageUsed')[0];
  if (change === 'permission') h.update({ currentTeamPermissionsInfo: { team: { allowed: false } } });
  if (change === 'plugin') h.update({ pluginsList: [] });
  if (change === 'scope') { h.scope.region = 'region-b'; h.update({}); }
  if (change === 'unmount') h.page.componentWillUnmount();
  const currentState = h.page.state;
  stale.callback({ bean: { used_storage: { value: 999, unit: 'GB' } } });
  stale.handleError(new Error('obsolete storage request'));
  assert.deepStrictEqual(h.page.state, currentState, `${change} must discard the old storage response`);
  assert.strictEqual(h.errors.length, 0);
  assert.strictEqual(h.timers.size, 0);
  if (change === 'permission') h.update(permissionProps);
  if (change === 'plugin') h.update(billingProps);
  if (change === 'scope') h.matching('index/fetchOverview').slice(-1)[0].callback(overview);
  if (change !== 'unmount') {
    assert.strictEqual(h.matching('global/fetchStorageUsed').length, 2, 'old pending read must not block an eligible new generation');
  }
}
{
  const h = harness({ billing: true, permission: true });
  h.matching('index/fetchOverview')[0].callback(overview);
  h.matching('global/fetchStorageUsed')[0].callback({ bean: { used_storage: { value: 0, unit: 'GB' } } });
  h.update({ currentTeamPermissionsInfo: { team: { allowed: false } } });
  h.update(permissionProps);
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, 1, 'regaining permission must reuse already loaded same-scope data, including zero');
}
{
  const h = harness({ billing: true, permission: true });
  h.matching('index/fetchOverview')[0].callback(overview);
  h.matching('global/fetchStorageUsed')[0].handleError(new Error('first failure'));
  for (let i = 0; i < 5; i += 1) h.update({});
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, 1, 'renders must not bypass failure retry delay');
  assert.strictEqual(h.timers.size, 1);
  h.fire(10000);
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, 2);
  h.matching('global/fetchStorageUsed')[1].handleError(new Error('persistent failure'));
  for (let i = 0; i < 5; i += 1) h.update({});
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, 2, 'automatic storage retry must be bounded');
  assert.strictEqual(h.timers.size, 0);
}
{
  const h = harness({ billing: true, permission: true });
  h.matching('index/fetchOverview')[0].callback(overview);
  h.matching('global/fetchStorageUsed')[0].handleError(new Error('retry pending'));
  h.page.componentWillUnmount();
  assert.strictEqual(h.timers.size, 0, 'unmount cancels bounded storage retry');
}
{
  const h = harness({ billing: true, permission: true });
  const oldOverview = h.matching('index/fetchOverview')[0];
  const oldEvents = h.matching('index/fetchEvents')[0];
  h.scope.team = 'team-b'; h.update({});
  oldOverview.callback(overview); oldOverview.handleError(new Error('old overview'));
  oldEvents.callback({ list: ['old event'], total: 1 }); oldEvents.handleError(new Error('old events'));
  assert.strictEqual(h.matching('global/fetchStorageUsed').length, 0);
  assert.deepStrictEqual(h.page.state.events, []);
  assert.strictEqual(h.errors.length, 0);
  const current = h.matching('index/fetchOverview').slice(-1)[0];
  current.callback({ bean: { region_health: true, team_id: 'team-id-b' } });
  assert.strictEqual(h.matching('global/fetchStorageUsed')[0].payload.tenant_id, 'team-id-b');
}

const modelSource = fs.readFileSync(path.join(__dirname, '../../../models/index.js'), 'utf8');
const modelAst = parser.parse(modelSource, { sourceType: 'module' });
const model = modelAst.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
const effect = model.properties.find(node => node.key.name === 'effects').value.properties.find(node => node.key.name === 'fetchOverview');
const fetchOverview = new Function('getTeamRegionOverview', `return ({ ${modelSource.slice(effect.start, effect.end)} }).fetchOverview;`)(() => {});
function startEffect(action) {
  const generator = fetchOverview(action, { call: (fn, payload) => ({ call: payload }), put: update => ({ put: update }) });
  assert.deepStrictEqual(generator.next().value, { call: action.payload });
  return generator;
}
for (const change of ['scope', 'unmount']) {
  const h = harness({ billing: true, permission: true });
  const request = startEffect(h.matching('index/fetchOverview')[0]);
  if (change === 'scope') { h.scope.region = 'region-b'; h.update({}); }
  if (change === 'unmount') h.page.componentWillUnmount();
  assert.strictEqual(request.next(overview).done, true, `${change} must reject overview before global store and callback`);
}
for (const guarded of [true, false]) {
  let active = true;
  let callbacks = 0;
  const action = { payload: {}, callback: () => { callbacks += 1; } };
  if (guarded) action.shouldApply = () => active;
  const request = startEffect(action);
  assert.deepStrictEqual(request.next(overview).value, { put: { type: 'saveOverviewInfo', payload: overview.bean } });
  active = false;
  assert.strictEqual(request.next().done, true);
  assert.strictEqual(callbacks, guarded ? 0 : 1);
}
console.log('team event request load lifecycle tests passed');
