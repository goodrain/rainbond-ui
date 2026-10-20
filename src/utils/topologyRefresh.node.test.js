const test = require('node:test');
const assert = require('node:assert/strict');
const { topologyScope, captureTopologyOperation, subscribeTopologyRefresh, postTopologyRefresh } = require('./topologyRefresh');

const location = { hash: '#/team/team/region/region/apps/31/overview?type=components' };

test('operation captures its original team/region/application and requires current component membership', () => {
  const calls = [];
  const scope = topologyScope('team', 'region', 31);
  const stop = subscribeTopologyRefresh(scope, event => calls.push(event), () => [{ service_alias: 'component', service_id: 'id' }]);
  const complete = captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location);
  complete({ status_code: 200, business_code: 200 }); assert.equal(calls.length, 1);
  captureTopologyOperation({ team_name: 'other', app_alias: 'component' }, location)({ status_code: 200, business_code: 200 });
  captureTopologyOperation({ team_name: 'team', app_alias: 'unrelated' }, location)({ status_code: 200, business_code: 200 });
  captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location)({ status_code: 500 });
  captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location)({ error: 'failure' });
  captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location)({ status_code: 200, business_code: 500 });
  captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location)({ status_code: 200 });
  captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location)({ status_code: 201, business_code: 201 });
  assert.equal(calls.length, 1);
  stop(); complete({ status_code: 200, business_code: 200 }); assert.equal(calls.length, 1);
});

test('late operation cannot refresh a new application, region or newly mounted same-scope page', () => {
  let count = 0;
  const remove = subscribeTopologyRefresh(topologyScope('team', 'region', 31), () => { count += 1; }, () => [{ service_alias: 'component' }]);
  const complete = captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location);
  remove();
  const cleanups = [31, 32].map(id => subscribeTopologyRefresh(topologyScope('team', 'region', id), () => { count += 1; }, () => [{ service_alias: 'component' }]));
  cleanups.push(subscribeTopologyRefresh(topologyScope('team', 'other', 31), () => { count += 1; }, () => [{ service_alias: 'component' }]));
  complete({ status_code: 200, business_code: 200 }); assert.equal(count, 0);
  cleanups.forEach(cleanup => cleanup());
});

test('batch component membership and explicit application operation remain scoped', () => {
  let count = 0;
  const remove = subscribeTopologyRefresh(topologyScope('team', 'region', 31), () => { count += 1; }, () => [{ service_id: 'id' }]);
  captureTopologyOperation({ team_name: 'team', serviceIds: ['other', 'id'] }, location)({ status_code: 200, business_code: 200 });
  captureTopologyOperation({ team_name: 'team', group_id: 31 }, location)({ status_code: 200, business_code: 200 });
  captureTopologyOperation({ team_name: 'team', region_name: 'other', group_id: 31 }, location)({ status_code: 200, business_code: 200 });
  assert.equal(count, 2); remove();
});

test('frame bridge targets its actual origin and requires a complete current scope', () => {
  const calls = [];
  const iframe = { src: 'http://fixture/static/www/weavescope-topolog/index.html', contentWindow: { postMessage: (...args) => calls.push(args) } };
  assert.equal(postTopologyRefresh(iframe, topologyScope('team', 'region', 31), undefined, 'http://fixture'), true);
  assert.equal(calls[0][1], 'http://fixture'); assert.equal(calls[0][0].type, 'rainbond:topology-refresh');
  assert.equal(postTopologyRefresh(iframe, ''), false); assert.equal(postTopologyRefresh(null, 'scope'), false);
  assert.equal(postTopologyRefresh(iframe, 'scope', undefined, 'https://another'), false);
});

test('view failures never change a successful mutation completion', () => {
  const stop = subscribeTopologyRefresh(topologyScope('team', 'region', 31), () => { throw new Error('view'); }, () => [{ service_alias: 'component' }]);
  const complete = captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location);
  assert.doesNotThrow(() => complete({ status_code: 200, business_code: 200 })); stop();
  const stopLookup = subscribeTopologyRefresh(topologyScope('team', 'region', 31), () => {}, () => { throw new Error('unmounted props'); });
  const lateComplete = captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location);
  assert.doesNotThrow(() => lateComplete({ status_code: 200, business_code: 200 })); stopLookup();
});
