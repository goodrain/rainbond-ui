const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const parser = require('@babel/parser');
const helpers = require('../../components/Team/TeamEventList/helpers');
const pollingHelpers = require('../Component/componentPolling');
const bootstrapHelpers = require('../../utils/teamOverviewBootstrap');

function productionMethods(file) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  return declaration.body.body.filter(node => !['render', 'renderActivities'].includes(node.key.name))
    .map(node => source.slice(node.start, node.end)).join('\n');
}

function productionRenderPrelude(file, lastVariable, result, dependencies) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const render = declaration.body.body.find(node => node.key.name === 'render');
  const last = render.body.body.find(node => node.type === 'VariableDeclaration' &&
    node.declarations.some(variable => variable.id.name === lastVariable));
  return new Function(...Object.keys(dependencies), `return function() {
    ${source.slice(render.body.start + 1, last.end)}
    return { ${result} };
  };`)(...Object.values(dependencies));
}

function harness({ standalone = false, billing = false, permission = false, eventPermission = true, delayChild = false, dispatchResult } = {}) {
  const requests = [];
  const errors = [];
  const timers = new Map();
  const scope = { team: 'team-a', region: 'region-a' };
  let serial = 0;
  let child;
  let parent;
  let deferChild = delayChild;
  class PureComponent {
    constructor(props) { this.props = props; }
    setState(update, callback) {
      const updates = typeof update === 'function' ? update(this.state, this.props) : update;
      if (!updates) return;
      const previousState = this.state;
      this.state = { ...this.state, ...updates };
      if (this._reactMounted) {
        if (this._onRender) this._onRender();
        this.componentDidUpdate(this.props, previousState);
      }
      if (callback) callback();
    }
  }
  const queryPermissionsInfo = (team, type) => ({
    isAccess: type === 'team_overview' ? !!team?.allowed : type === 'team_dynamic' ? team?.dynamic !== false : true
  });
  const dependencies = {
    PureComponent, ...helpers, ...pollingHelpers, ...bootstrapHelpers, MenuContext: {},
    TeamImg: 'default-team-logo',
    roleUtil: { queryPermissionsInfo },
    newRole: { queryPermissionsInfo },
    pluginUtile: { isInstallEnterprisePlugin: () => false },
    PluginUtil: { isInstallPlugin: list => (list || []).some(plugin => plugin.name === 'rainbond-bill') },
    globalUtil: { getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region, withoutPermission() {} },
    routerRedux: { push: payload => ({ type: 'router/push', payload }) },
    userUtil: { getTeamByTeamName: () => ({ team_name: scope.team }) },
    handleAPIError: error => errors.push(error),
    setTimeout: (callback, delay) => { const id = ++serial; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id)
  };
  function load(file) {
    return new Function(...Object.keys(dependencies), `return class extends PureComponent { ${productionMethods(file)} };`)
      (...Object.values(dependencies));
  }
  const Parent = load(path.join(__dirname, 'index.js'));
  const Child = load(path.join(__dirname, '../../components/Team/TeamEventList/index.js'));
  const renderCards = productionRenderPrelude(path.join(__dirname, '../../components/Team/TeamEventList/index.js'),
    'overviewItems', 'overviewInfo, loadingOverview, storageUsed, overviewItems', dependencies);
  const renderHeader = productionRenderPrelude(path.join(__dirname, 'index.js'), 'logoInfo', 'logoInfo', dependencies);
  const props = {
    dispatch: action => {
      requests.push(action);
      return dispatchResult && dispatchResult(action);
    },
    currUser: { teams: [] }, currentEnterprise: null, currentTeam: { team_name: scope.team },
    currentRegionName: scope.region, location: { search: '?tab=event' },
    pluginsList: billing ? [{ name: 'rainbond-bill' }] : [],
    currentTeamPermissionsInfo: { team: { allowed: permission, dynamic: eventPermission } }
  };
  function update(instance, nextProps) {
    const previous = instance.props;
    instance.props = { ...instance.props, ...nextProps };
    if (instance._onRender) instance._onRender();
    instance.componentDidUpdate(previous, instance.state);
  }
  function mountChild(childProps) {
    child = new Child(childProps);
    child._reactMounted = true;
    child.componentDidMount();
  }
  function syncChild() {
    if (deferChild) return;
    if (parent.state.scope !== 'event') {
      if (child) { child.componentWillUnmount(); child._reactMounted = false; child = null; }
      return;
    }
    const childProps = { ...parent.props, overviewSnapshot: parent.state.overviewSnapshot };
    if (!child) mountChild(childProps);
    else update(child, childProps);
  }
  if (standalone) mountChild(props);
  else {
    parent = new Parent(props);
    parent.componentWillMount();
    parent._onRender = syncChild;
    syncChild(); // Children mount before their parent's componentDidMount.
    parent._reactMounted = true;
    parent.componentDidMount();
  }
  return {
    requests, errors, timers, scope, parent,
    get child() { return child; },
    renderCards: () => renderCards.call(child),
    renderHeader: () => renderHeader.call(parent),
    matching: type => requests.filter(action => action.type === type),
    update(nextProps = {}) { update(standalone ? child : parent, nextProps); },
    mountDeferredChild() { deferChild = false; syncChild(); },
    unmount() {
      if (child) { child.componentWillUnmount(); child._reactMounted = false; }
      if (parent) { parent.componentWillUnmount(); parent._reactMounted = false; }
    },
    fireRetry() {
      const [id, timer] = [...timers][0];
      timers.delete(id); timer.callback();
    }
  };
}

const overview = { bean: { region_health: true, team_id: 'team-id-a', team_app_num: 3, logo: 'team-a-logo' } };
const billingProps = { pluginsList: [{ name: 'rainbond-bill' }] };
const permissionProps = { currentTeamPermissionsInfo: { team: { allowed: true } } };

test('initial parent and child share exactly one pending request and one success', () => {
  const h = harness({ billing: true, permission: true });
  assert.equal(h.matching('index/fetchOverview').length, 1);
  assert.equal(h.child.state.loadingOverview, true);
  assert.equal(h.child.state.overviewInfo, null);
  h.matching('index/fetchOverview')[0].callback(overview);
  assert.equal(h.matching('index/fetchOverview').length, 1);
  assert.equal(h.child.state.loadingOverview, false);
  assert.equal(h.child.state.overviewInfo, overview.bean);
  assert.equal(helpers.getTeamOverviewData(h.parent.state.overviewSnapshot, h.parent.getOverviewScope()).logo, 'team-a-logo');
  assert.equal(h.matching('global/fetchStorageUsed').length, 1);
  h.update(); h.update();
  assert.equal(h.matching('index/fetchOverview').length, 1);
});

test('a sequential child consumer reuses the settled initialization, not merely an in-flight promise', () => {
  const h = harness({ delayChild: true });
  h.matching('index/fetchOverview')[0].callback(overview);
  h.mountDeferredChild();
  assert.equal(h.child.state.overviewInfo, overview.bean);
  assert.equal(h.child.state.loadingOverview, false);
  assert.equal(h.matching('index/fetchOverview').length, 1);
});

test('same-scope refresh generations reject older pending requests, including before DVA store writes', () => {
  const h = harness();
  const old = h.matching('index/fetchOverview')[0];
  h.parent.loadOverview();
  assert.equal(old.shouldApply(), false);
  old.callback(overview); old.handleError(new Error('old generation'));
  assert.equal(h.child.state.overviewInfo, null);
  assert.equal(h.errors.length, 0);
  h.matching('index/fetchOverview')[1].callback(overview);
  assert.equal(h.child.state.overviewInfo, overview.bean);
});

test('the production render never exposes old cards, storage or logo before update lifecycles run', () => {
  const h = harness({ billing: true, permission: true });
  h.matching('index/fetchOverview')[0].callback(overview);
  h.matching('global/fetchStorageUsed')[0].callback({ bean: { used_storage: { value: 2, unit: 'GB' } } });
  assert.equal(h.renderCards().overviewItems[0].value, 3);
  assert.equal(h.renderCards().overviewItems[4].value, 2);
  assert.equal(h.renderHeader().logoInfo, 'team-a-logo');
  const previous = h.child.props;
  h.child.props = { ...previous, overviewSnapshot: { scope: h.child.getScope(), generation: 2, status: 'pending', response: null } };
  assert.equal(h.renderCards().overviewInfo, null);
  assert.equal(h.renderCards().loadingOverview, true);
  assert.equal(h.renderCards().storageUsed, 0);
  h.child.props = previous;
  h.scope.region = 'region-b';
  assert.equal(h.renderCards().overviewInfo, null);
  assert.equal(h.renderCards().storageUsed, 0);
  assert.equal(h.renderHeader().logoInfo, 'default-team-logo');
});

for (const completeFirst of [false, true]) {
  for (const pluginFirst of [false, true]) {
    test(`initial automatic permissions reuse the ${completeFirst ? 'settled' : 'pending'} overview when billing arrives ${pluginFirst ? 'first' : 'last'}`, () => {
      const h = harness({ eventPermission: false });
      assert.equal(h.parent.state.scope, 'member');
      assert.equal(h.child, undefined);
      const initial = h.matching('index/fetchOverview')[0];
      if (completeFirst) initial.callback(overview);
      if (pluginFirst) h.update(billingProps);
      h.update({ currentTeamPermissionsInfo: { team: { allowed: true, dynamic: true } } });
      assert.equal(h.parent.state.scope, 'event');
      assert.equal(h.matching('index/fetchOverview').length, 1, 'automatic resolution is part of the same initialization');
      assert.equal(h.child.state.loadingOverview, !completeFirst);
      if (!completeFirst) initial.callback(overview);
      if (!pluginFirst) h.update(billingProps);
      assert.equal(h.matching('index/fetchOverview').length, 1);
      assert.equal(h.matching('global/fetchStorageUsed').length, 1);
      assert.equal(h.child.state.overviewInfo, overview.bean);
    });
  }
}

for (const change of ['team', 'region']) {
  test(`${change} switch clears cards/logo/storage and rejects the previous response before store writes`, () => {
    const h = harness({ billing: true, permission: true });
    const first = h.matching('index/fetchOverview')[0];
    first.callback(overview);
    const storage = h.matching('global/fetchStorageUsed')[0];
    h.parent.loadOverview();
    const old = h.matching('index/fetchOverview')[1];
    h.scope[change] = `${change}-b`;
    h.update({ currentRegionName: h.scope.region, currentTeam: { team_name: h.scope.team } });
    assert.equal(old.shouldApply(), false);
    const state = h.parent.state;
    old.callback({ bean: { ...overview.bean, logo: 'wrong-logo', team_app_num: 999 } });
    old.handleError(new Error('obsolete overview'));
    storage.callback({ bean: { used_storage: { value: 999, unit: 'GB' } } });
    assert.equal(h.parent.state, state);
    assert.equal(h.child.state.overviewInfo, null);
    assert.equal(helpers.getTeamOverviewData(h.parent.state.overviewSnapshot, h.parent.getOverviewScope()), null);
    assert.equal(h.child.state.storageUsed, 0);
    assert.equal(h.errors.length, 0);
    const current = h.matching('index/fetchOverview').at(-1);
    current.callback({ bean: { ...overview.bean, team_id: 'team-id-b' } });
    assert.equal(h.child.state.overviewInfo.team_id, 'team-id-b');
    assert.equal(h.matching('global/fetchStorageUsed').at(-1).payload.tenant_id, 'team-id-b');
  });
}

test('unmount rejects pending overview and storage callbacks without errors or updates', () => {
  const h = harness({ billing: true, permission: true });
  const old = h.matching('index/fetchOverview')[0];
  h.unmount();
  const state = h.parent.state;
  assert.equal(old.shouldApply(), false);
  old.callback(overview); old.handleError(new Error('unmounted'));
  assert.equal(h.parent.state, state);
  assert.equal(h.errors.length, 0);
  assert.equal(h.matching('global/fetchStorageUsed').length, 0);
});

for (const failure of ['callback', 'error', 'business']) {
  test(`shared overview ${failure} failure ends loading and never starts an automatic retry`, () => {
    const h = harness({ billing: true, permission: true });
    const action = h.matching('index/fetchOverview')[0];
    if (failure === 'callback') action.callback(null);
    if (failure === 'business') action.callback({ status_code: 503, bean: overview.bean });
    if (failure === 'error') action.handleError(new Error('current failure'));
    assert.equal(h.parent.state.overviewSnapshot.status, 'error');
    assert.equal(h.child.state.loadingOverview, false);
    assert.equal(h.child.state.overviewInfo, null);
    for (let i = 0; i < 5; i += 1) h.update();
    assert.equal(h.matching('index/fetchOverview').length, 1);
    assert.equal(h.matching('global/fetchStorageUsed').length, 0);
    assert.equal(h.timers.size, 0);
    action.callback(overview);
    assert.equal(h.parent.state.overviewSnapshot.status, 'error', 'late success cannot reverse a settled failure');
  });
}

test('DVA handled empty responses end pending state for shared and standalone consumers', async () => {
  for (const standalone of [false, true]) {
    const h = harness({ standalone, dispatchResult: action => action.type === 'index/fetchOverview' ? Promise.resolve() : undefined });
    await Promise.resolve();
    assert.equal(h.child.state.loadingOverview, false);
    assert.equal(h.child.state.overviewInfo, null);
    assert.equal(h.matching('index/fetchOverview').length, 1);
  }
});

test('standalone child retains its own current-scope overview fallback', () => {
  const h = harness({ standalone: true, billing: true, permission: true });
  assert.equal(h.matching('index/fetchOverview').length, 1);
  h.matching('index/fetchOverview')[0].callback(overview);
  assert.equal(h.child.state.overviewInfo, overview.bean);
  assert.equal(h.matching('global/fetchStorageUsed').length, 1);
});

for (const order of [
  ['overview', 'plugin', 'permission'], ['overview', 'permission', 'plugin'],
  ['plugin', 'overview', 'permission'], ['permission', 'overview', 'plugin'],
  ['plugin', 'permission', 'overview'], ['permission', 'plugin', 'overview']
]) {
  test(`shared storage gates handle late dependencies: ${order.join(', ')}`, () => {
    const h = harness();
    for (const item of order) {
      if (item === 'overview') h.matching('index/fetchOverview')[0].callback(overview);
      if (item === 'plugin') h.update(billingProps);
      if (item === 'permission') h.update(permissionProps);
    }
    assert.equal(h.matching('index/fetchOverview').length, 1);
    assert.equal(h.matching('global/fetchStorageUsed').length, 1);
    h.matching('global/fetchStorageUsed')[0].handleError(new Error('storage unavailable'));
    h.update(); h.update();
    assert.equal(h.timers.size, 1);
    h.fireRetry();
    h.matching('global/fetchStorageUsed')[1].handleError(new Error('still unavailable'));
    h.update(); h.update();
    assert.equal(h.matching('global/fetchStorageUsed').length, 2);
    assert.equal(h.timers.size, 0);
  });
}

test('returning to activities and successful editing request fresh overview without parent/child duplication', () => {
  const h = harness();
  h.matching('index/fetchOverview')[0].callback(overview);
  h.parent.handleTabChange('member');
  assert.equal(h.child, null);
  h.parent.handleTabChange('event');
  assert.equal(h.matching('index/fetchOverview').length, 2);
  assert.equal(h.child.state.loadingOverview, true);
  h.matching('index/fetchOverview')[1].callback({ bean: { ...overview.bean, team_app_num: 4 } });
  assert.equal(h.child.state.overviewInfo.team_app_num, 4);
  h.parent.handleEditName({ team_alias: 'new team name' });
  h.matching('teamControl/editTeamAlias')[0].callback();
  assert.equal(h.matching('index/fetchOverview').length, 3);
  assert.equal(h.child.state.overviewInfo, null);
  h.matching('index/fetchOverview')[2].callback({ bean: { ...overview.bean, logo: 'edited-logo' } });
  assert.equal(helpers.getTeamOverviewData(h.parent.state.overviewSnapshot, h.parent.getOverviewScope()).logo, 'edited-logo');
  assert.equal(h.child.state.overviewInfo.logo, 'edited-logo');
});

test('URL and history navigation back to activities refresh once, unlike automatic permission hydration', () => {
  const h = harness();
  h.matching('index/fetchOverview')[0].callback(overview);
  h.update({ location: { search: '?tab=member' } });
  assert.equal(h.parent.state.scope, 'member');
  assert.equal(h.child, null);
  h.update({ location: { search: '?tab=event' } });
  assert.equal(h.parent.state.scope, 'event');
  assert.equal(h.matching('index/fetchOverview').length, 2);
  h.matching('index/fetchOverview')[1].callback(overview);
  h.update({ location: { search: '?tab=event' } });
  assert.equal(h.matching('index/fetchOverview').length, 2);
});

test('out-of-order event pagination still keeps the newest page', () => {
  const h = harness();
  const first = h.matching('index/fetchEvents')[0];
  h.child.handlePageChange(2);
  const second = h.matching('index/fetchEvents')[1];
  second.callback({ list: ['page-2'], total: 24 });
  first.callback({ list: ['page-1'], total: 24 });
  assert.deepEqual(h.child.state.events, ['page-2']);
  assert.equal(h.child.state.page, 2);
});

test('production render passes the snapshot and never reads unscoped global overview cards', () => {
  const parentSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
  const childSource = fs.readFileSync(path.join(__dirname, '../../components/Team/TeamEventList/index.js'), 'utf8');
  assert.match(parentSource, /<TeamEventList[^>]*overviewSnapshot=\{overviewSnapshot\}/);
  assert.doesNotMatch(childSource, /index\?*\.overviewInfo/);
  assert.match(childSource, /const overviewInfo = this\.isOverviewShared\(\)[\s\S]*getTeamOverviewData\(snapshot, this\.getScope\(\)\)/);
  assert.match(childSource, /const storageUsed = this\.storageOverview === overviewInfo \? loadedStorageUsed : 0/);
});
