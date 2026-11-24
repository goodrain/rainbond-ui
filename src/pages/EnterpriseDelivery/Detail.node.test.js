const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
function detail() {
  const source = fs.readFileSync(`${__dirname}/Detail.js`, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const component = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const method = component.body.body.find(node => node.key && node.key.name === 'load');
  const Target = vm.runInNewContext(`class Target { ${source.slice(method.start, method.end)} }; Target`);
  const target = new Target(), requests = [];
  target.props = { user: { user_id: 1, enterprise_id: 'enterprise', is_enterprise_admin: true }, match: { params: { eid: 'enterprise', groupId: 'profile' } }, dispatch: r => requests.push(r) };
  target.state = { group: { id: 'profile' }, runtimeLoading: false, runtime: { app: { group_name: 'Old app' }, components: [{ service_id: 'old' }] }, source: [{ service_id: 'old' }], histories: { old: {} } };
  target.active = () => true;target.followDelivery = () => false;
  target.runtimeCalls = 0;target.runtime = () => { target.runtimeCalls++; };
  target.loadSources = () => {};target.loadTargets = () => {};
  target.setState = (update, callback) => { Object.assign(target.state, update);if (callback) callback(); };
  const bean = exists => ({ groups: [{ id: 'profile', versions: [] }], deployments: [], source_app_exists: exists });
  return { target, requests, bean };
}
test('center polling never starts periodic runtime refresh', () => {
  const { target, requests, bean } = detail();
  target.runtimeUpdated = 0;
  target.load(true);requests[0].callback(bean(true));
  target.load(true);requests[1].callback(bean(true));
  assert.equal(target.runtimeCalls, 0);
});
test('source deletion clears stale runtime and histories without requesting the deleted application', () => {
  const { target, requests, bean } = detail();
  target.load(true);requests[0].callback(bean(false));
  assert.equal(target.state.group.sourceDeleted, true);
  assert.equal(target.state.runtime.deleted, true);
  assert.equal(target.state.source.length, 0);
  assert.equal(Object.keys(target.state.histories).length, 0);
  assert.equal(target.runtimeCalls, 0);
});
