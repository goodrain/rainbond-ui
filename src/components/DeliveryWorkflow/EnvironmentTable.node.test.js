const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');

function table() {
  const source = fs.readFileSync(`${__dirname}/EnvironmentTable.js`, 'utf8');
  const node = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'decorators-legacy'] })
    .program.body.find(item => item.type === 'ExportDefaultDeclaration').declaration;
  const methods = node.body.body.filter(item => item.key && ['receiveInformation', 'componentWillUnmount'].includes(item.key.name))
    .map(item => source.slice(item.start, item.end)).join('\n');
  const Target = vm.runInNewContext(`class Target { ${methods} }; Target`);
  const component = new Target(), requests = [];
  component.alive = true;component.tickets = {};component.state = { information: {}, statuses: {} };
  component.setState = update => Object.assign(component.state, typeof update === 'function' ? update(component.state) : update);
  component.props = { dispatch: action => requests.push(action) };
  return { component, requests };
}
const row = { id: 'task', target: { team_name: 'old-team', region_name: 'old-region', app_id: '1' } };
const info = { current_version: '2.0.0', updated_at: '2026-11-15T10:00:00',
  target: { team_name: 'target-team', region_name: 'target-region', app_id: '42' } };

test('environment status uses the actual target and a status failure retains version and update time', () => {
  const { component, requests } = table();component.receiveInformation(row, info);
  assert.equal(requests[0].payload.kind, 'environmentStatus');
  assert.equal(requests[0].payload.scope.teamName, 'target-team');
  assert.equal(requests[0].payload.scope.regionName, 'target-region');
  assert.equal(requests[0].payload.scope.appID, '42');
  requests[0].onError();
  assert.equal(component.state.statuses.task, 'unavailable');
  assert.equal(component.state.information.task, info);
});
test('a deleted application does not issue a runtime status request', () => {
  const { component, requests } = table();component.receiveInformation(row, { ...info, target_deleted: true });
  assert.equal(requests.length, 0);
  assert.equal(component.state.information.task.target_deleted, true);
});
test('late runtime responses cannot overwrite a deleted target or unmounted table', () => {
  const { component, requests } = table();component.receiveInformation(row, info);
  component.receiveInformation(row, { ...info, target_deleted: true });
  requests[0].callback({ status: 'RUNNING' });
  assert.equal(component.state.statuses.task, null);
  component.receiveInformation(row, info);component.componentWillUnmount();
  requests[1].callback({ status: 'RUNNING' });
  assert.equal(component.state.statuses.task, null);
});
