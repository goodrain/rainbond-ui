const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
const path = require('node:path');
function source(file) {
  const text = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  return { text, ast: parser.parse(text, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] }) };
}
function target(file, names, globals) {
  const { text, ast } = source(file);
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const members = declaration.body.body.filter(node => names.includes(node.key && node.key.name));
  const Target = vm.runInNewContext(`class Target { ${members.map(node => text.slice(node.start, node.end)).join('\n')} }; Target`, globals);
  const result = new Target();
  result.setState = (update, callback) => { Object.assign(result.state, typeof update === 'function' ? update(result.state) : update);if (callback) callback(); };
  return result;
}
const params = { teamName: 'source', regionName: 'region', appID: '42' };
const routerRedux = { push: route => route, replace: route => route };
const deliveryPath = () => '/delivery';
test('snapshot publication routes only saved snapshots with release permission', () => {
  let allowed = true;
  const page = target('pages/AppVersion/index.js', ['publishSnapshot'], { canPublishTemplate: () => allowed, routerRedux, deliveryPath });
  const requests = [];
  page.props = { match: { params }, dispatch: request => requests.push(request) };
  page.publishSnapshot({ timelineState: 'history', detail: { version_id: 51 } });
  assert.equal(requests[0].query.snapshot_id, '51');
  assert.equal(requests[0].pathname, '/delivery/create');
  page.publishSnapshot({ timelineState: 'runtime', detail: { version_id: 51 } });
  page.publishSnapshot({ timelineState: 'history', detail: {} });
  allowed = false;page.publishSnapshot({ timelineState: 'history', detail: { version_id: 52 } });
  assert.equal(requests.length, 1);
});
test('snapshot editor loads frozen source and picks the next delivery version independently', () => {
  const { nextTemplateVersion } = require('./templateTimeline');
  const editor = target('pages/Group/Delivery/index.js', ['scope', 'load'], {
    getScope: params => params, snapshotId: props => props.location.query.snapshot_id, nextTemplateVersion
  });
  let action;
  editor.props = { user: { user_id: 1 }, match: { params }, location: { query: { snapshot_id: '51' } }, dispatch: request => { action = request; } };
  editor.state = { values: { version: '1.0.0' }, dirty: false };
  editor.active = () => true;editor.loadConfigs = () => {};
  editor.load();
  assert.equal(action.payload.scope.snapshotId, '51');
  action.callback({ template: { id: 'profile' }, sourceSnapshot: { version_id: '51', version: '0.0.3' },
    latestVersion: '2.0.0', components: [{ service_id: 'frozen' }, { service_id: 'unbuilt', delivery_available: false }] });
  assert.equal(editor.state.values.version, '2.0.1');
  assert.equal(editor.state.values.service_ids.join(','), 'frozen');
  assert.equal(editor.state.sourceSnapshot.version, '0.0.3');
});
test('existing source and creation APIs receive snapshot identity only for explicit imports', async () => {
  const { text, ast } = source('services/templateDelivery.js');
  const declarations = ast.program.body.filter(node => node.type === 'ExportNamedDeclaration' &&
    ['loadDeliverySource', 'publishDeliveryTemplate'].includes(node.declaration && node.declaration.id && node.declaration.id.name));
  const requests = [];
  const functions = vm.runInNewContext(`${declarations.map(node => text.slice(node.declaration.start, node.declaration.end)).join('\n')}\n({loadDeliverySource,publishDeliveryTemplate})`, {
    urlFor: () => '/api', request: async (url, options) => requests.push({ url, options }), buildTemplatePayload: () => ({ version: '2.0.1' })
  });
  await functions.loadDeliverySource({ regionName: 'region', snapshotId: '51' });
  await functions.publishDeliveryTemplate({ scope: { regionName: 'region', snapshotId: '51' }, options: {} });
  await functions.loadDeliverySource({ regionName: 'region' });
  await functions.publishDeliveryTemplate({ scope: { regionName: 'region' }, options: {} });
  assert.equal(requests[0].options.params.snapshot_id, '51');
  assert.equal(requests[1].options.data.snapshot_id, '51');
  assert.equal(Object.hasOwn(requests[2].options.params, 'snapshot_id'), false);
  assert.equal(Object.hasOwn(requests[3].options.data, 'snapshot_id'), false);
});
test('only a saved version opens the existing listing modal once and clears the route trigger', () => {
  let allowed = true;
  const page = target('pages/Group/Delivery/Records.js', ['openSnapshotListing'], { canPublishTemplate: () => allowed, routerRedux, deliveryPath });
  const actions = [];
  page.props = { match: { params }, location: { query: { publish_version: 'saved', keep: 'filter' } }, dispatch: action => actions.push(action) };
  page.state = { listing: null };
  page.openSnapshotListing([{ id: 'another' }]);assert.equal(page.state.listing, null);
  allowed = false;page.openSnapshotListing([{ id: 'saved' }]);assert.equal(page.state.listing, null);
  allowed = true;page.openSnapshotListing([{ id: 'saved', version: '2.0.1' }]);
  assert.equal(page.state.listing.id, 'saved');
  assert.equal(actions[0].query.publish_version, undefined);
  assert.equal(actions[0].query.keep, 'filter');
  page.state.listing = null;page.openSnapshotListing([{ id: 'saved' }]);
  assert.equal(page.state.listing, null);assert.equal(actions.length, 1);
});
test('a backend that ignores snapshot_id cannot silently publish current runtime content', async () => {
  const text = fs.readFileSync(path.join(__dirname, '../services/templateDelivery.js'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const context = { require, apiconfig: { baseUrl: '' }, request: async url => url.endsWith('/source') ?
    { bean: { apps: [] } } : { bean: { items: [] } } };
  vm.runInNewContext(text, context);
  await assert.rejects(() => context.loadDeliveryComponents({ ...params, snapshotId: '51' }), /componentsUnavailable/);
  const normal = await context.loadDeliveryComponents(params);
  assert.equal(normal.bean.components.length, 0);
});
