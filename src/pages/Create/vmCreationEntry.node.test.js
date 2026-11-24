const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const entry = require('./vmCreationEntry');

const transform = (text, filename) => babel.transformSync(text, {
  filename, babelrc: false, configFile: false,
  presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default],
  plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
}).code;

function harness({ target, allowed = true, appAllowed = allowed, appConstruct = appAllowed, allowedApps, handleType, sourceType = 'url' } = {}) {
  const filename = path.resolve(__dirname, 'virtual-machine.js');
  const actions = [], confirmations = [], errors = [], permissionCalls = [];
  const scope = { team: 'team-a', region: 'region-a', application: '', allowed, appAllowed, appConstruct, allowedApps };
  const exported = {};
  vm.runInNewContext(transform(fs.readFileSync(filename, 'utf8'), filename), {
    exports: exported, URLSearchParams,
    require(name) {
      if (name === 'react') return React;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'dva/router') return { routerRedux: {
        replace: destination => ({ type: 'navigate', destination }),
        push: destination => ({ type: 'navigate', destination })
      } };
      if (name === 'antd') return { Select: Object.assign(() => null, { Option: 'Option' }), Form: Object.assign(() => null, { Item: 'FormItem' }),
        Card: 'Card', Alert: 'Alert', Button: 'Button', Spin: 'Spin', message: { error: value => errors.push(value) }, Modal: { confirm: value => confirmations.push(value) } };
      if (name.endsWith('/utils/global')) return { getCurrTeamName: () => scope.team,
        getCurrRegionName: () => scope.region, getAppID: () => scope.application };
      if (name.endsWith('/utils/newRole')) return { queryPermissionsInfo: (data, module, application) => {
        permissionCalls.push({ module, application });
        return module === 'app_overview' ? {
          isCreate: scope.appAllowed && (!scope.allowedApps || scope.allowedApps.includes(application)),
          isConstruct: scope.appConstruct
        } : { isAccess: scope.allowed };
      }, noPermission: () => 'forbidden' };
      if (name.endsWith('/utils/pulginUtils')) return { isInstallPlugin: list => list.some(item => /^rainbond-vm(?:-(?:AMD64|ARM64))?$/.test(item.name)) };
      if (name === './vmCreationEntry') return entry;
      if (name === '@/utils/intl') return { formatMessage: value => value.id };
      if (name.endsWith('/AddOrEditGroup')) return 'AddGroup';
      return {};
    }
  }, { filename });
  const instance = new exported.default({
    currUser: { enterprise_id: 'enterprise-a', is_enterprise_admin: true },
    handleType, ...(handleType === 'Service' ? { groupId: target } : {}),
    currentTeamPermissionsInfo: { team: {} }, dispatch: action => actions.push(action),
    location: { query: { group_id: target, source_type: sourceType,
      vm_url: 'https://invalid.example/should-not-be-forwarded.qcow2', login_password: 'opaque-test-only' } }
  });
  instance.setState = (update, callback) => {
    Object.assign(instance.state, typeof update === 'function' ? update(instance.state) : update);
    if (callback) callback();
  };
  instance.componentDidMount();
  const read = type => actions.filter(action => action.type === type).at(-1);
  const complete = (groups = [{ group_id: 68, group_name: 'migration' }], plugins = [{ name: 'rainbond-vm' }]) => {
    read('global/fetchGroups').callback(groups);
    read('teamControl/fetchPluginUrl').callback({ status_code: 200, list: plugins });
  };
  return { instance, scope, actions, read, complete, confirmations, errors, permissionCalls,
    routes: () => actions.filter(action => action.type === 'navigate') };
}

test('entry destination accepts only a real target and whitelisted navigation fields', () => {
  for (const id of [null, '', '0', '-1', '../68', ['68'], '1e2', '9007199254740992'])
    assert.equal(entry.normalizeVmTargetGroupId(id), '');
  assert.equal(entry.normalizeVmTargetGroupId(68), '68');
  assert.deepEqual(entry.vmCreationEntryDestination({ team: 'team-a', region: 'region-a' }, '68', 'upload'), {
    pathname: '/team/team-a/region/region-a/apps/68/overview', query: { type: 'vm-create', source_type: 'upload' }
  });
  assert.equal(entry.vmCreationEntryDestination({ team: '../team', region: 'r' }, 68), null);
  assert.deepEqual(entry.vmCreationEntryDestination({ team: 't', region: 'r' }, 68, 'secret-value').query, { type: 'vm-create' });
  assert.equal(entry.requestedVmTargetGroup({ location: { search: '?group_id=68' } }), '68');
});

test('an existing app waits for real groups and plugin before navigating without source or credentials', () => {
  const h = harness({ target: '68', sourceType: 'existing' });
  h.read('global/fetchGroups').callback([{ group_id: 68, group_name: 'migration' }]);
  assert.equal(h.routes().length, 0);
  h.read('teamControl/fetchPluginUrl').callback({ status_code: 200, list: [{ name: 'rainbond-vm-AMD64' }] });
  assert.equal(h.routes().length, 1);
  assert.equal(h.routes()[0].destination.pathname, '/team/team-a/region/region-a/apps/68/overview');
  assert.deepEqual(JSON.parse(JSON.stringify(h.routes()[0].destination.query)), { type: 'vm-create', source_type: 'existing' });
  assert.equal(JSON.stringify(h.actions).includes('opaque-test-only'), false);
  assert.equal(JSON.stringify(h.actions).includes('should-not-be-forwarded'), false);
  h.instance.openRequestedTarget();
  assert.equal(h.routes().length, 1);
  assert.ok(h.actions.every(action => ['global/fetchGroups', 'teamControl/fetchPluginUrl', 'navigate'].includes(action.type)));
});

test('no target shows actual application options and continues only to a listed app', () => {
  const h = harness();
  h.complete([{ group_id: 68, group_name: 'migration' }, { group_id: 70, group_name: 'dev' }]);
  assert.equal(h.routes().length, 0);
  assert.deepEqual(h.instance.state.groups.map(group => group.group_id), [68, 70]);
  h.instance.state.selectedGroupId = '999'; h.instance.handleContinue();
  assert.equal(h.routes().length, 0);
  h.instance.state.selectedGroupId = '70'; h.instance.handleContinue();
  assert.equal(h.routes()[0].destination.pathname, '/team/team-a/region/region-a/apps/70/overview');
});

test('a requested app absent from the current list requires a new selection', () => {
  const h = harness({ target: '99' }); h.complete();
  assert.equal(h.routes().length, 0); assert.equal(h.instance.state.invalidTarget, true);
});

test('permission denial or missing plugin prevents navigation and VM creation', () => {
  const denied = harness({ target: '68', allowed: false });
  assert.equal(denied.actions.length, 0); assert.equal(denied.instance.render(), 'forbidden');
  const missing = harness({ target: '68' }); missing.complete(undefined, []);
  assert.equal(missing.instance.state.pluginStatus, 'missing'); assert.equal(missing.routes().length, 0);
  missing.instance.openTarget('68'); assert.equal(missing.routes().length, 0);
  missing.instance.handlePluginInstall();
  assert.equal(missing.confirmations.length, 1);
});

function findElement(element, type, predicate = () => true) {
  if (!element || typeof element !== 'object') return null;
  if (element.type === type && predicate(element)) return element;
  return React.Children.toArray(element.props?.children).map(child => findElement(child, type, predicate)).find(Boolean);
}

const newAppValues = { group_name: 'migration target', k8s_app: 'migration-target', note: 'VM application', logo: '/images/example.png' };

test('new app uses the shared pure form and a single whitelisted DVA request before navigation', () => {
  const h = harness(); h.complete(); h.instance.onAddGroup();
  const form = findElement(h.instance.render(), 'AddGroup').props;
  assert.equal(form.isAddGroup, false); assert.equal(form.isEditEnglishName, true); assert.equal(form.loading, false);
  form.onOk({ ...newAppValues, vm_url: 'https://invalid.example/disk', login_password: 'not-forwarded' });
  form.onOk(newAppValues);
  const creations = h.actions.filter(action => action.type === 'application/addGroup');
  assert.equal(creations.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(creations[0].payload)), {
    team_name: 'team-a', region_name: 'region-a', ...newAppValues
  });
  assert.equal(findElement(h.instance.render(), 'AddGroup').props.loading, true);
  assert.equal(h.routes().length, 0);
  creations[0].callback({ group_id: 81 });
  assert.equal(h.routes()[0].destination.pathname, '/team/team-a/region/region-a/apps/81/overview');
  assert.equal(h.instance.state.addGroupSubmitting, false);
  assert.ok(h.actions.every(action => ['global/fetchGroups', 'teamControl/fetchPluginUrl', 'application/addGroup', 'navigate'].includes(action.type)));
});

test('cancelled and reopened new-app requests ignore the old completion', () => {
  const h = harness(); h.complete(); h.instance.onAddGroup();
  const first = findElement(h.instance.render(), 'AddGroup').props;
  first.onOk(newAppValues); const oldRequest = h.read('application/addGroup');
  first.onCancel(); assert.equal(h.instance.state.addGroupSubmitting, false);
  oldRequest.callback({ group_id: 80 }); assert.equal(h.routes().length, 0);
  h.instance.onAddGroup(); const second = findElement(h.instance.render(), 'AddGroup').props;
  first.onOk(newAppValues);
  assert.equal(h.actions.filter(action => action.type === 'application/addGroup').length, 1);
  second.onOk(newAppValues); const currentRequest = h.read('application/addGroup');
  oldRequest.callback({ group_id: 80 }); oldRequest.handleError(); assert.equal(h.routes().length, 0);
  assert.equal(h.instance.state.addGroupSubmitting, true);
  currentRequest.callback({ group_id: 81 });
  assert.equal(h.routes()[0].destination.pathname, '/team/team-a/region/region-a/apps/81/overview');
});

test('new-app failure releases loading and permits an explicit retry without stale global refreshes', () => {
  const h = harness(); h.complete(); h.instance.onAddGroup();
  const form = findElement(h.instance.render(), 'AddGroup').props;
  form.onOk(newAppValues); const failedRequest = h.read('application/addGroup'); failedRequest.handleError();
  assert.equal(h.instance.state.addGroupSubmitting, false); assert.equal(h.errors.length, 1);
  form.onOk(newAppValues);
  failedRequest.callback({ group_id: 999 }); failedRequest.handleError();
  assert.equal(h.routes().length, 0); assert.equal(h.instance.state.addGroupSubmitting, true);
  h.read('application/addGroup').callback({});
  assert.equal(h.instance.state.addGroupSubmitting, false); assert.equal(h.errors.length, 2);
  form.onOk(newAppValues); h.read('application/addGroup').callback({ group_id: 82 });
  assert.equal(h.actions.filter(action => action.type === 'application/addGroup').length, 3);
  assert.equal(h.actions.filter(action => action.type === 'global/fetchGroups').length, 1);
  assert.equal(h.actions.some(action => action.type === 'user/fetchCurrent'), false);
  assert.equal(h.routes()[0].destination.pathname, '/team/team-a/region/region-a/apps/82/overview');
});

test('scope changes and unmount invalidate group/plugin callbacks and new-app completion', () => {
  const h = harness({ target: '68' });
  const oldGroups = h.read('global/fetchGroups'), oldPlugin = h.read('teamControl/fetchPluginUrl');
  h.scope.region = 'region-b'; h.instance.componentDidUpdate();
  assert.equal(oldGroups.shouldApply(), false); assert.equal(oldPlugin.shouldApply(), false);
  oldGroups.callback([{ group_id: 68 }]); oldPlugin.callback({ status_code: 200, list: [{ name: 'rainbond-vm' }] });
  assert.equal(h.routes().length, 0);
  h.instance.requestedGroup = ''; h.complete(); h.instance.onAddGroup();
  findElement(h.instance.render(), 'AddGroup').props.onOk(newAppValues);
  const createApp = h.read('application/addGroup');
  h.instance.componentWillUnmount(); createApp.callback({ group_id: 99 }); createApp.handleError();
  assert.equal(h.routes().length, 0);
});

test('revoked permission and failed reads remain blocked until an explicit retry', () => {
  const h = harness({ target: '68' });
  h.scope.allowed = false; h.scope.appAllowed = false;
  h.read('global/fetchGroups').callback([{ group_id: 68 }]);
  h.read('teamControl/fetchPluginUrl').callback({ status_code: 200, list: [{ name: 'rainbond-vm' }] });
  assert.equal(h.routes().length, 0);
  h.scope.allowed = true; h.scope.appAllowed = true; h.instance.loadTargets();
  h.read('global/fetchGroups').handleError();
  h.read('teamControl/fetchPluginUrl').handleError();
  assert.equal(h.instance.state.groupsStatus, 'failed'); assert.equal(h.instance.state.pluginStatus, 'failed');
  h.instance.loadTargets(); h.complete(); assert.equal(h.routes().length, 1);
});


test('existing Service entry uses its application create and construct rights without team application creation', () => {
  const h = harness({ target: '68', handleType: 'Service', allowed: false, appAllowed: true, allowedApps: ['app_68'] });
  h.complete();
  assert.equal(h.routes().length, 1);
  assert.equal(h.routes()[0].destination.pathname, '/team/team-a/region/region-a/apps/68/overview');
  assert.ok(h.permissionCalls.some(call => call.module === 'app_overview' && call.application === 'app_68'));
  const newAppButton = findElement(h.instance.render(), 'Button', element => element.props.children === 'popover.newApp.title');
  assert.equal(newAppButton.props.disabled, true);
  h.instance.onAddGroup();
  assert.equal(h.instance.state.addGroup, false);
  assert.equal(h.actions.some(action => action.type === 'application/addGroup'), false);
});

test('missing application create or construct rights blocks an existing Service target', () => {
  for (const permission of [{ appAllowed: false, appConstruct: true }, { appAllowed: true, appConstruct: false }]) {
    const h = harness({ target: '68', handleType: 'Service', allowed: true, ...permission });
    assert.equal(h.instance.render(), 'forbidden'); assert.equal(h.actions.length, 0);
  }
  const noTarget = harness({ allowed: false, appAllowed: true });
  assert.equal(noTarget.instance.render(), 'forbidden'); assert.equal(noTarget.actions.length, 0);
});

test('team application creation cannot substitute for rights in a selected existing application', () => {
  const h = harness({ allowed: true, appAllowed: false }); h.complete();
  h.instance.state.selectedGroupId = '68'; h.instance.handleContinue();
  assert.equal(h.routes().length, 0); assert.equal(h.instance.state.invalidTarget, true);
  h.instance.onAddGroup();
  assert.equal(h.instance.state.addGroup, true);
});
