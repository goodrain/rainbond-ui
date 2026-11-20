const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { normalizeTemplateConfig, deliveryScope } = require('./templateDelivery');
const { sourceBaseline, compareSource, templateGroups, nextTemplateVersion, deleteTemplateVersion } = require('./templateTimeline');
const scope = { enterprise_id: 'enterprise', teamName: 'team', regionName: 'region', appID: '1' };
const user = { user_id: 1, enterprise_id: 'enterprise', nick_name: 'Owner' };
const component = { service_id: 'web', name: 'Web', source_type: 'source_code', source: 'https://example.com/web.git', branch: 'main', commit: '1234567' };
const config = () => normalizeTemplateConfig(component, [{ attr_name: 'MODE', attr_value: 'production' }, { attr_name: 'ACCESS_KEY', attr_value: '$INSTALL_VALUE' }], { current_cpu: 0 });
const baseline = () => sourceBaseline([component], { web: config() });
const record = (id, version, created_at, extra = {}) => ({ id, version, created_at, scope: deliveryScope(scope), template_name: 'Portal', ...extra });

test('versions group under their template and use chronological order rather than row order', () => {
  const groups = templateGroups([record('a', '1.0.0', '2026-11-06T08:00:00Z'), record('b', '1.0.1', '2026-11-06T17:00:00+08:00'),
    record('c', '2.0.0', '2026-11-06T10:00:00Z', { deleted_at: '2026-11-06' }), record('d', '1.0.0', '2026-11-06', { template_name: 'Other' })]);
  assert.equal(groups.length, 2);assert.equal(groups[0].template_name, 'Portal');
  assert.deepEqual(groups[0].versions.map(item => item.id), ['c', 'b', 'a']);
  assert.equal(groups[0].latest.id, 'b', 'deleted versions do not become the comparison baseline');
  assert.equal(nextTemplateVersion(['1.2.9', '1.10.0', '1.0']), '1.10.1');
});

test('unchanged source ignores object and environment ordering without storing sensitive values', () => {
  const original = config(), before = sourceBaseline([component], { web: original });
  original.service_env_map_list.reverse();
  const after = sourceBaseline([{ ...component, status: 'starting', cpu_usage: 9000 }], { web: original });
  assert.equal(compareSource(before, after).status, 'unchanged');
  assert.equal(JSON.stringify(before).includes('$INSTALL_VALUE'), false);
  assert.equal(before.components[0].scaling.container_cpu, 0);
});

test('build source, variables, resources and component additions/removals produce explicit changes', () => {
  const before = baseline(), changed = config();changed.service_env_map_list[0].attr_value = 'testing';changed.extend_method_map.init_memory = 2048;
  const current = sourceBaseline([{ ...component, commit: 'newcommit' }, { ...component, service_id: 'api', name: 'API' }], { web: changed, api: config() });
  const diff = compareSource(before, current);
  assert.equal(diff.summary.added_count, 1);assert.equal(diff.summary.updated_count, 1);
  assert.deepEqual(diff.details.find(item => item.service_id === 'web').fields, ['source', 'environment', 'resources']);
  assert.equal(compareSource(current, before).summary.removed_count, 1);
  assert.equal(JSON.stringify(diff).includes('testing'), false, 'change details do not disclose variable values');
});

test('intentional template overrides do not change the captured source and old missing baselines remain unknown', () => {
  const original = config(), before = sourceBaseline([component], { web: original });
  original.service_env_map_list[0].attr_value = 'template-default';
  assert.equal(before.components[0].environment.find(item => item.name === 'MODE').value, 'production');
  assert.equal(compareSource(before, baseline()).status, 'unchanged');
  assert.equal(compareSource(null, baseline()).status, 'unknown');
  assert.throws(() => sourceBaseline([component], {}), /configIncomplete/);
});

test('deleting one version retains its source record and does not affect other versions or deployment history', () => {
  const records = [record('new', '1.1.0', '2026-11-06'), record('old', '1.0.0', '2026-11-05')], deployments = [{ template_id: 'old', target: { app_name: 'Portal' } }];
  const result = deleteTemplateVersion(records, { scope, user, authorized: true, templateId: 'old' }, '2026-11-06T00:00:00Z');
  assert.equal(result.length, 2);assert.equal(result[1].deleted_by, 'Owner');
  assert.equal(records[1].deleted_at, undefined);assert.equal(result[0], records[0]);
  assert.equal(deployments[0].target.app_name, 'Portal');
  assert.equal(templateGroups(result)[0].latest.id, 'new');
});

test('deletion checks scope and permission while preserving independent listing history', () => {
  const row = record('v1', '1.0.0', '2026-11-05'), args = { scope, user, authorized: true, templateId: 'v1' };
  assert.throws(() => deleteTemplateVersion([row], { ...args, authorized: false }, ''), /permissionRequired/);
  assert.throws(() => deleteTemplateVersion([row], { ...args, scope: { ...scope, appID: '2' } }, ''), /versionUnavailable/);
  const listing = { template: row, status: 'approved' };
  const result = deleteTemplateVersion([row], args, 'now');
  assert.equal(result[0].deleted_at, 'now');assert.equal(listing.template.deleted_at, undefined);assert.equal(listing.status, 'approved');
});

test('a stable template ID groups renamed template versions together', () => {
  const rows = [{ id: 'one', template_id: 'stable-id', template_name: 'Old name', scope: 'scope', version: '1.0.0', created_at: '2026-11-01' },
    { id: 'two', template_id: 'stable-id', template_name: 'New name', scope: 'scope', version: '1.1.0', created_at: '2026-11-02' }];
  const groups = templateGroups(rows);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].latest.id, 'two');
});

test('late change detection cannot replace the result for a newer application', () => {
  const path = `${__dirname}/../pages/Group/Delivery/Records.js`, source = fs.readFileSync(path, 'utf8');
  const ast = require('@babel/parser').parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = declaration.body.body.filter(node => node.key && ['active', 'checkChanges', 'scheduleCheck'].includes(node.key.name));
  const Target = vm.runInNewContext(`class Target { ${methods.map(node => source.slice(node.start, node.end)).join('\n')} };Target`, {
    document: { hidden: false }, setTimeout: () => 1, clearTimeout() {}, getScope: () => scope
  });
  const target = new Target(), requests = [];
  target.alive = true;target.generation = 0;target.checkTicket = 0;target.state = {};
  target.props = { user, match: { params: {} }, dispatch: action => requests.push(action) };
  target.setState = (patch, callback) => { target.state = { ...target.state, ...patch };if (callback) callback(); };
  const records = [record('v1', '1.0.0', '2026-11-05')];
  target.checkChanges(records);target.generation += 1;target.checking = false;target.checkChanges(records);
  requests[0].callback({ checks: [{ status: 'changed', baseline_id: 'old' }] });
  assert.equal(target.checking, true);assert.equal(target.state.checks, undefined);
  requests[1].callback({ checks: [{ status: 'unchanged', baseline_id: 'current' }] });
  assert.equal(target.state.checks[0].baseline_id, 'current');
});
