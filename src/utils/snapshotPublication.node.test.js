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

function publicationHistory() {
  const source = fs.readFileSync(resolve(__dirname, '../pages/AppVersion/index.js'), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const component = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const members = component.body.body.filter(node => node.key && ['getPublishRecordsScopeKey', 'fetchPublishRecords',
    'openPublishRecordsDrawer', 'closePublishRecordsDrawer'].includes(node.key.name));
  const Target = vm.runInNewContext(`class Target { ${members.map(node => source.slice(node.start, node.end)).join('\n')} }; Target`);
  const target = new Target(), requests = [];
  target.props = { match: { params: { teamName: 'source', regionName: 'region', appID: '42' } },
    currentUser: { user_id: 1, enterprise_id: 'enterprise' }, dispatch: action => requests.push(action) };
  target.state = { publishRecords: [], publishRecordsVisible: false };
  target.publishRecordsTicket = 0;target.unmounted = false;
  target.setState = (update, callback) => { Object.assign(target.state, update);if (callback) callback(); };
  return { target, requests };
}
test('publication history loads the original application records on demand with server pagination', () => {
  const { target, requests } = publicationHistory();
  assert.equal(requests.length, 0);
  target.openPublishRecordsDrawer();
  assert.equal(target.state.publishRecordsVisible, true);
  assert.equal(requests[0].type, 'application/fetchShareRecords');
  assert.equal(JSON.stringify(requests[0].payload), JSON.stringify({ team_name: 'source', app_id: '42', page: 1, page_size: 10 }));
  const row = { record_id: 7, app_model_name: 'Historical template', version: '0.3.0', status: 1 };
  requests[0].callback({ bean: { total: 21 }, list: [row] });
  assert.equal(target.state.publishRecords[0], row);
  assert.equal(target.state.publishRecordsTotal, 21);
  target.fetchPublishRecords(3, 10);
  assert.equal(requests[1].payload.page, 3);
  requests[1].callback({ bean: { total: 21 }, list: [{ record_id: 1 }] });
  assert.equal(target.state.publishRecordsPage, 3);
  assert.equal(target.state.publishRecords[0].record_id, 1);
});
test('late publication history responses cannot replace a new page, reopen a drawer or cross application scope', () => {
  const { target, requests } = publicationHistory();
  target.openPublishRecordsDrawer();target.fetchPublishRecords(2, 10);
  requests[1].callback({ bean: { total: 11 }, list: [{ record_id: 2 }] });
  requests[0].callback({ bean: { total: 100 }, list: [{ record_id: 1 }] });
  assert.equal(target.state.publishRecords[0].record_id, 2);
  assert.equal(target.state.publishRecordsTotal, 11);
  target.closePublishRecordsDrawer();requests[1].onError();
  assert.equal(target.state.publishRecordsVisible, false);
  assert.equal(target.state.publishRecordsFailed, false);
  target.openPublishRecordsDrawer();
  target.props.match.params.appID = '43';
  requests[2].callback({ bean: { total: 100 }, list: [{ record_id: 99 }] });
  assert.equal(target.state.publishRecords.length, 0);
  target.unmounted = true;requests[2].onError();
  assert.equal(target.state.publishRecordsFailed, false);
});
test('publication history distinguishes failed loading from empty records and supports retry', () => {
  const { target, requests } = publicationHistory();
  target.openPublishRecordsDrawer();requests[0].onError();
  assert.equal(target.state.publishRecordsFailed, true);
  assert.equal(target.state.publishRecordsLoading, false);
  target.fetchPublishRecords();requests[1].callback({ bean: { total: 0 }, list: [] });
  assert.equal(target.state.publishRecordsFailed, false);
  assert.equal(target.state.publishRecordsTotal, 0);
  target.fetchPublishRecords();requests[2].callback({ bean: {}, list: [] });
  assert.equal(target.state.publishRecordsFailed, true);
});
test('existing publication history effect reports HTTP and transport failures to the drawer', () => {
  const source = fs.readFileSync(resolve(__dirname, '../models/application.js'), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module' });
  const model = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const effects = model.properties.find(node => node.key.name === 'effects').value;
  const method = effects.properties.find(node => node.key.name === 'fetchShareRecords');
  const effect = vm.runInNewContext(`({${source.slice(method.start, method.end)}}).fetchShareRecords`, { getShareRecords: () => {} });
  let failures = 0;
  const action = { payload: {}, onError: () => { failures++; } };
  const first = effect(action, { call: () => ({}) });first.next();first.next(undefined);
  const second = effect(action, { call: () => ({}) });second.next();second.throw(new Error('transport failed'));
  assert.equal(failures, 2);
  let record;
  const success = effect({ payload: {}, callback: response => { record = response.list[0]; } }, { call: () => ({}) });
  success.next();success.next({ bean: { total: 1 }, list: [{ record_id: 9 }] });
  assert.equal(record.record_id, 9);
});

function historicalExport() {
  const source = fs.readFileSync(resolve(__dirname, '../pages/AppVersion/index.js'), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const component = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = component.body.body.filter(node => node.key && ['buildPublishRecordExportData', 'canExportPublishRecord',
    'showSharedAppExport', 'hideSharedAppExport'].includes(node.key.name));
  let allowed = true;
  const permissionCalls = [];
  const Target = vm.runInNewContext(`class Target { ${methods.map(node => source.slice(node.start, node.end)).join('\n')} }; Target`, {
    roleUtil: { queryPermissionsInfo: (...args) => { permissionCalls.push(args);return { isExport: allowed }; } }
  });
  const target = new Target();
  target.props = { currentTeamPermissionsInfo: { team: { sub_models: [] } } };
  target.getAppId = () => '42';target.state = { exportRecord: null };
  target.setState = update => Object.assign(target.state, update);
  return { target, permissionCalls, deny: () => { allowed = false; } };
}
test('historical export uses the published model and version instead of the live application or snapshot', () => {
  const { target, permissionCalls } = historicalExport();
  const row = { record_id: 5, app_model_id: 'published-model', app_model_name: 'Historical template',
    version: '0.3.0', app_version_info: 'Saved version notes', scope: 'team', status: 1, is_success: true };
  assert.equal(target.canExportPublishRecord(row), true);
  assert.equal(permissionCalls[0][1], 'app_release');
  assert.equal(permissionCalls[0][2], 'app_42');
  target.showSharedAppExport(row);
  assert.equal(target.state.exportRecord, row);
  const app = target.buildPublishRecordExportData(row);
  assert.equal(app.app_id, 'published-model');
  assert.equal(app.version.join(','), '0.3.0');
  assert.equal(app.versions_info[0].version, '0.3.0');
  assert.equal(app.versions_info[0][0], undefined, 'text notes must not be spread as metadata fields');
  target.hideSharedAppExport();assert.equal(target.state.exportRecord, null);
});
test('historical export requires the original export permission and a completed local publication', () => {
  const { target, deny } = historicalExport();
  const row = { app_model_id: 'published-model', version: '1.0.0', scope: 'enterprise', status: 1 };
  assert.equal(target.canExportPublishRecord(row), true);
  for (const changes of [{ status: 0 }, { status: 2 }, { scope: 'goodrain' }, { is_success: false },
    { app_model_id: '' }, { version: '' }, { version: [] }]) {
    target.showSharedAppExport({ ...row, ...changes });
    assert.equal(target.state.exportRecord, null);
  }
  deny();target.showSharedAppExport(row);
  assert.equal(target.state.exportRecord, null);
  assert.equal(target.canExportPublishRecord(row), false);
  target.props.currentTeamPermissionsInfo = null;
  assert.equal(target.canExportPublishRecord(row), false);
});
