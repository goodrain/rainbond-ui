const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const parser = require('@babel/parser');
const babel = require('@umijs/deps/compiled/babel/core');

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
  const actions = [];
  let reads = 0;
  const dependencies = {
    currentFormType: 'vm',
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
  dependencies.handleFormSubmit = extract('handleFormSubmit');
  const install = extract('handleInstallApp');
  const options = { bindReadCredentials: () => { reads += 1; throw new Error('Unexpected credential read'); } };
  return { actions, install, submit: dependencies.handleFormSubmit, options, reads: () => reads };

}

for (const target of [868, undefined]) {
  secureTest(`legacy component submission cannot create a VM or app for target ${target || 'new'}`, () => {
    const h = parentHarness();
    const value = { ...source(target), group_id: target, group_name: 'entry-app' };
    h.install(value, '', h.options);
    h.submit(value, '', h.options);
    assert.equal(h.actions.length, 0);
    assert.equal(h.reads(), 0);
  });
}

secureTest('unexpected credential fields cannot reach legacy VM actions', () => {
  for (const field of ['login_password', 'vm_login_password']) {
    const h = parentHarness();
    const value = { ...source(), [field]: 'opaque-test-only-input' };
    h.install(value, '', h.options);
    h.submit(value, '', h.options);
    assert.equal(h.actions.length, 0);
    assert.equal(h.reads(), 0);
  }
});
