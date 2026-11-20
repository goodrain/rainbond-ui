const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
const { deliveryUpgradePath } = require('../../utils/deliveryUpgrade');
const { deliveryTargetIsCached } = require('../../utils/deliveryNavigation');
const info = { available: true, current_version: '1.0', latest_version: '2.0', app_model_id: 'model', upgrade_group_id: '7',
  target: { team_name: 'target', region_name: 'production', app_id: '42' } };
function action() {
  const source = fs.readFileSync(`${__dirname}/DeliveryUpgradeAction.js`, 'utf8');
  const declaration = parser.parse(source, { sourceType: 'module', plugins: ['jsx','classProperties','decorators-legacy'] })
    .program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = declaration.body.body.filter(node => node.key && ['load','open','componentWillUnmount'].includes(node.key.name))
    .map(node => source.slice(node.start,node.end)).join('\n');
  const Target = vm.runInNewContext(`class Target { ${methods} }; Target`, {
    deliveryUpgradePath, deliveryTargetIsCached, routerRedux: { push: path => ({ type: 'navigate', path }) },clearInterval:()=>{}
  });
  const component = new Target(), actions = [];
  component.alive = true;component.ticket = 0;component.state = {};
  component.setState = patch => Object.assign(component.state,patch);
  component.props = { task: {id:'task',kind:'delivery',status:'succeeded'},user:{teams:[]},dispatch:action=>actions.push(action) };
  return {component,actions};
}
test('opening upgrade rechecks availability and refreshes an uncached target before routing', () => {
  const { component,actions } = action();component.open();
  assert.equal(actions[0].type,'deliveryCenter/upgrade');
  actions[0].callback(info);
  assert.equal(actions[1].type,'user/fetchCurrent');
  actions[1].callback({bean:{teams:[{team_name:'target',region:[{team_region_name:'production'}]}]}});
  assert.equal(actions[2].path,deliveryUpgradePath(info));
});
test('a target already upgraded to latest does not navigate on a stale visible action', () => {
  const { component,actions } = action();component.open();actions[0].callback({available:false});
  assert.equal(actions.length,1);assert.equal(component.state.busy,false);
});
test('a source page closed during scope refresh cannot redirect later', () => {
  const { component,actions } = action();component.open();actions[0].callback(info);component.componentWillUnmount();
  actions[1].callback({bean:{teams:[{team_name:'target',region:[{team_region_name:'production'}]}]}});
  assert.equal(actions.length,2);
});
test('exports, failed installs and test deployments never query upgrade availability', () => {
  for(const task of [{kind:'test',status:'succeeded'},{kind:'offline',status:'succeeded'},{kind:'delivery',status:'failed'}]) {
    const { component,actions } = action();component.props.task=task;component.load();assert.equal(actions.length,0);
  }
});
test('environment rows receive actual current version even when no upgrade is available', () => {
  const { component, actions } = action();
  const received = [];
  component.props.onInfo = value => received.push(value);
  component.load();
  const current = { available: false, current_version: '2.0', updated_at: '2026-11-15T10:00:00Z' };
  actions[0].callback(current);
  assert.equal(received[0], current);
});
test('a failed environment check clears previously displayed current version', () => {
  const { component, actions } = action();
  const received = [];
  component.props.onInfo = value => received.push(value);
  component.load();actions[0].callback(info);
  component.load();actions[1].onError();
  assert.deepEqual(received, [info, null]);
});
