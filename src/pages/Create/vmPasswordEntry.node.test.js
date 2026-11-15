const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const React = require('react');
const parser = require('@babel/parser');
const babel = require('@umijs/deps/compiled/babel/core');
const login = require('../../utils/vmLoginCredentials');

const transform = (text, filename) => babel.transformSync(text, {
  filename, babelrc: false, configFile: false,
  presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default],
  plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
}).code;
function secureTest(name, run) {
  test(name, () => { try { run(); } catch (_) { throw new Error(name); } });
}
function source(group = 868) {
  return { group_id: group, service_cname: 'entry-vm', login_method: 'password', ssh_username: 'ubuntu' };
}
function parentHarness() {
  const filename = path.resolve(__dirname, '../../components/CreateComponentModal/index.js');
  const text = fs.readFileSync(filename, 'utf8');
  const ast = parser.parse(text, { sourceType: 'module', plugins: ['jsx'] });
  const scope = { team: 'team-a', region: 'region-a', application: '' };
  const actions = [], bindings = [];
  let reads = 0, clears = 0;
  const form = { loginCredentialGeneration: 0, clearSshFields() { clears += 1; this.loginCredentialGeneration += 1; } };
  const dependencies = {
    ...login, currentFormType: 'vm', vmWorkflowActive: false,
    currentVmScope: () => ({ ...scope }), vmMountedRef: { current: true }, vmVisibleRef: { current: true },
    vmFormRef: { current: form },
    globalUtil: { getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region, getAppID: () => scope.application },
    dispatch: action => actions.push(action), routerRedux: { push: value => ({ type: 'navigate', value }) },
    message: { warning() {} }, vmText: key => key, onCancel() {}, handleAPIError() {}, handleApplicationCreationError() {}
  };
  function extract(name) {
    let found;
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'VariableDeclarator' && node.id?.name === name) found = node.init;
      for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
    }
    visit(ast);
    assert.ok(Boolean(found), 'The native entry handler must exist');
    const context = { ...dependencies, module: { exports: undefined } };
    vm.runInNewContext(transform(`module.exports = (${text.slice(found.start, found.end)});`, filename), context);
    return context.module.exports;
  }
  dependencies.captureVmRequestActivity = extract('captureVmRequestActivity');
  dependencies.handleFormSubmit = extract('handleFormSubmit');
  const install = extract('handleInstallApp');
  const reader = () => { reads += 1; return {}; };
  const options = { passwordBootstrapSupported: true, bindReadCredentials: group => { bindings.push(group); return reader; } };
  return { scope, actions, install, options, reader, form, bindings, dependencies,
    reads: () => reads, clears: () => clears,
    creates: () => actions.filter(action => action.type === 'createApp/createAppByVirtualMachine') };
}

secureTest('native non-workflow VM entry binds its selected app and forwards an unread sibling provider', () => {
  const h = parentHarness();
  h.install(source(), '', h.options);
  const action = h.creates()[0];
  assert.ok(Boolean(action) && action.payload.group_id === 868, 'The existing target app must be retained');
  assert.ok(h.bindings.length === 1 && h.bindings[0] === '868', 'The provider must bind to the selected app');
  assert.ok(action.readCredentials === h.reader && h.reads() === 0, 'The native parent must forward without reading');
  assert.ok(!Object.hasOwn(action.payload, 'login_password') && !Object.hasOwn(action.payload, 'readCredentials'), 'The serialized action payload must stay safe');
  action.callback({ bean: { service_alias: 'gr-entry' } });
  assert.ok(h.clears() === 1, 'A real alias must clear the native credential store');
});

secureTest('new-group VM entry binds only after addGroup returns its resolved application', () => {
  const h = parentHarness();
  h.install({ ...source(), group_id: undefined, group_name: 'entry-app' }, '', h.options);
  const group = h.actions.find(action => action.type === 'application/addGroup');
  assert.ok(Boolean(group) && h.creates().length === 0 && h.bindings.length === 0, 'No provider may bind before the app exists');
  group.callback({ group_id: 901 });
  assert.ok(h.creates()[0]?.payload.group_id === 901 && h.bindings[0] === '901', 'The resolved app must own the VM and reader');
  assert.ok(h.reads() === 0, 'App creation and VM dispatch must not read credentials');
});

secureTest('a late new-group callback cannot dispatch a VM after scope cancellation', () => {
  const h = parentHarness();
  h.install({ ...source(), group_id: undefined, group_name: 'entry-app' }, '', h.options);
  const group = h.actions.find(action => action.type === 'application/addGroup');
  h.scope.region = 'region-b';
  group.callback({ group_id: 901 });
  assert.ok(h.creates().length === 0 && h.bindings.length === 0 && h.reads() === 0, 'A stale app response must not bind or create a VM');
});

secureTest('non-workflow entry rejects serializable credentials before any action', () => {
  for (const field of ['login_password', 'vm_login_password']) {
    const h = parentHarness();
    h.install({ ...source(), [field]: 'opaque-test-only-input' }, '', h.options);
    assert.ok(h.actions.length === 0 && h.reads() === 0, 'Password-bearing source objects must never enter DVA actions');
  }
});

secureTest('legacy VM route forwards a bound provider and clears it on alias or unmount', () => {
  const filename = path.resolve(__dirname, 'virtual-machine.js');
  const exported = {}, actions = [];
  const scope = { team: 'team-a', region: 'region-a', application: '868' };
  vm.runInNewContext(transform(fs.readFileSync(filename, 'utf8'), filename), { exports: exported,
    require(name) {
      if (name === 'react') return React;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'dva/router') return { routerRedux: { push: value => ({ type: 'navigate', value }) } };
      if (name === 'antd') return { Select: { Option: 'Option' } };
      if (name.endsWith('/utils/global')) return { getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region, getAppID: () => scope.application };
      if (name.endsWith('/vmLoginCredentials')) return login;
      if (name.endsWith('/vmWorkflowDemo')) return { isVmWorkflowDemoEnabled: () => false };
      return {};
    }
  }, { filename });
  let clears = 0, reads = 0;
  const form = { loginCredentialGeneration: 0, clearSshFields() { clears += 1; this.loginCredentialGeneration += 1; } };
  const instance = new exported.default({ dispatch: action => actions.push(action) });
  instance.vmFormRef.current = form;
  instance.componentDidMount();
  const reader = () => { reads += 1; return {}; };
  instance.handleSubmit(source(), '', { passwordBootstrapSupported: true, boundGroupId: '868', readCredentials: reader });
  const action = actions.find(value => value.type === 'createApp/createAppByVirtualMachine');
  assert.ok(Boolean(action) && action.readCredentials === reader && reads === 0, 'The old route must carry the provider without reading');
  assert.ok(action.isActive(), 'The current route request must be active');
  action.callback({ bean: { service_alias: 'gr-entry' } });
  assert.ok(clears === 1 && !action.isActive(), 'Alias cleanup must invalidate the old request');
  instance.componentWillUnmount();
  assert.ok(!action.isActive() && reads === 0, 'Unmount must reject late work without reading credentials');
});
