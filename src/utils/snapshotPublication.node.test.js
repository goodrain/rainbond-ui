const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
const { resolve } = require('node:path');

test('snapshot publish opens application delivery without importing a snapshot or starting publication', () => {
  const source = fs.readFileSync(resolve(__dirname, '../pages/AppVersion/index.js'), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const component = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const method = component.body.body.find(node => node.key && node.key.name === 'publishSnapshot');
  assert.ok(method, 'saved snapshots should have a publish navigation action');
  let allowed = true;
  const Target = vm.runInNewContext(`class Target { ${source.slice(method.start, method.end)} }; Target`, {
    canPublishTemplate: () => allowed,
    deliveryPath: params => `/team/${params.teamName}/region/${params.regionName}/apps/${params.appID}/delivery`,
    routerRedux: { push: route => ({ type: 'navigate', route }) }
  });
  const target = new Target(), actions = [];
  target.props = { match: { params: { teamName: 'source', regionName: 'region', appID: '42' } },
    dispatch: action => actions.push(action) };
  target.publishSnapshot({ timelineState: 'history', detail: { version_id: 51 } });
  target.publishSnapshot({ timelineState: 'current', detail: { version_id: 52 } });
  assert.equal(actions.length, 2);
  for (const action of actions) {
    assert.equal(action.type, 'navigate');
    assert.equal(action.route, '/team/source/region/region/apps/42/delivery');
  }
  target.publishSnapshot({ timelineState: 'runtime', detail: { version_id: 51 } });
  target.publishSnapshot({ timelineState: 'history', detail: {} });
  allowed = false;target.publishSnapshot({ timelineState: 'history', detail: { version_id: 52 } });
  assert.equal(actions.length, 2);
});
