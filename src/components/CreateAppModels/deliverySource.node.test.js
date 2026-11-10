const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const parser = require('@babel/parser');
function modal(props) {
  const code = fs.readFileSync(`${__dirname}/index.js`, 'utf8');
  const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const declaration = ast.program.body.find(node => node.type === 'ClassDeclaration');
  const methods = declaration.body.body.filter(node => ['getResolvedScope', 'createAppModel', 'upAppModel'].includes(node.key && node.key.name));
  const Target = vm.runInNewContext(`class Target { ${methods.map(node => code.slice(node.start, node.end)).join('\n')} }; Target`);
  const target = new Target(), calls = [];
  target.props = { eid: 'enterprise', currentTeam: { team_name: 'old-selected-team' }, dispatch: action => calls.push(action), ...props };
  target.state = { imageUrl: '/uploads/logo.png', tagList: [], isShared: false };
  target.handleSubmitLoading = value => { target.loading = value; };
  return { target, calls };
}
test('reused modal keeps delivery templates team-private and binds to the source application', () => {
  const source = { team_name: 'source-team', region_name: 'source-region', app_id: '123' };
  const { target, calls } = modal({ fixedScope: 'team', team_name: 'source-team', deliverySource: source });
  target.createAppModel({ name: 'Template', describe: 'Purpose' });
  assert.equal(calls[0].type, 'market/createAppModel');
  assert.equal(calls[0].payload.team_name, 'source-team');
  assert.equal(calls[0].payload.scope, 'team');
  assert.deepEqual(calls[0].payload.delivery_source, source);
  target.props.appInfo = { app_id: 'template-id' };
  target.upAppModel({ name: 'Updated', describe: 'New purpose' });
  assert.equal(calls[1].type, 'market/upAppModel');
  assert.equal(calls[1].payload.app_id, 'template-id');
  assert.deepEqual(calls[1].payload.delivery_source, source);
  calls[1].handleError();
  assert.equal(target.loading, false);
});
test('catalog callers without an application source keep the existing payload behavior', () => {
  const { target, calls } = modal({ defaultScope: 'enterprise' });
  target.createAppModel({ name: 'CatalogTemplate', describe: 'Purpose' });
  assert.equal(calls[0].payload.delivery_source, undefined);
  assert.equal(calls[0].payload.scope, 'enterprise');
  assert.equal(calls[0].payload.team_name, 'old-selected-team');
});
