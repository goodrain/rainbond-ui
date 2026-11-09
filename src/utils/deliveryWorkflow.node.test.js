const test = require('node:test');
const assert = require('node:assert/strict');
const { submitListing, reviewListing, recordDelivery, listingGroups, successfulDeliveryEnvironments } = require('./deliveryWorkflow');
const { deliveryScope } = require('./templateDelivery');
const scope = { enterprise_id: 'enterprise', teamName: 'team', regionName: 'region', appID: '1' };
const user = { enterprise_id: 'enterprise', user_id: 10, nick_name: 'Applicant' };
const admin = { ...user, user_id: 1, nick_name: 'Administrator', is_enterprise_admin: true };
const template = { id: 'version-1', scope: deliveryScope(scope), template_name: 'Portal', version: '1.0.0',
  component_overrides: [{ service_id: 'web', service_env_map_list: [{ attr_name: 'MODE', attr_value: 'production' }] }], components: [{ service_id: 'web' }] };
const submit = (items = [], tpl = template, id = 'listing-1') => submitListing(items, { user, scope, template: tpl, reason: 'Publish portal', authorized: true, appName: 'Portal app' }, '2026-11-06', id);
const target = { team_name: 'team', region_name: 'region', app_name: 'portal-test' };
const deploy = (listings = [], overrides = {}) => recordDelivery([], { user, scope, template, authorized: true, kind: 'delivery', target, ...overrides }, listings, '2026-11-06', 'deployment-1');

test('listing requests freeze template content and group independent versions of the same template', () => {
  const first = submit();
  assert.notStrictEqual(first.template, template);
  const second = submit([first], { ...template, id: 'version-2', version: '2.0.0' }, 'listing-2');
  assert.equal(first.status, 'pending');
  assert.equal(second.group_id, first.group_id);
  const groups = listingGroups([first, second]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].versions.length, 2);
  assert.equal(groups[0].pending, 2);
  const older = { ...template, component_overrides: [{ service_id: 'web', service_env_map_list: [{ attr_name: 'API_KEY', attr_value: '$INSTALL_VALUE' }] }] };
  const frozen = submit([], older);
  assert.equal(frozen.template.component_overrides[0].service_env_map_list[0].attr_value, '');
  assert.equal(older.component_overrides[0].service_env_map_list[0].attr_value, '$INSTALL_VALUE', 'listing does not mutate the original version');
});
test('duplicate applications are blocked and rejected versions can be resubmitted while retaining history', () => {
  const first = submit();
  assert.throws(() => submit([first]), /alreadySubmitted/);
  const rejected = reviewListing(first, admin, 'rejected', 'Clarify configuration', 'later');
  const again = submit([rejected], template, 'again');
  assert.equal(again.group_id, rejected.group_id);
  assert.equal(rejected.status, 'rejected');
  assert.equal(again.status, 'pending');
  const group = listingGroups([again, rejected])[0];
  assert.equal(group.versions.length, 1, 'resubmission is one template version with review history');
  assert.equal(group.versions[0].history[0].review_comment, 'Clarify configuration');
});
test('review requires platform administrator permission and a rejection comment', () => {
  const first = submit();
  assert.throws(() => reviewListing(first, user, 'approved', '', ''), /forbidden/);
  assert.throws(() => reviewListing(first, admin, 'rejected', ' ', ''), /reviewReason/);
  const approved = reviewListing(first, admin, 'approved', 'Ready', 'later');
  assert.equal(approved.status, 'approved');
  assert.equal(first.status, 'pending');
  assert.throws(() => reviewListing(approved, admin, 'rejected', 'Changed', ''), /alreadyReviewed/);
});
test('ordinary unpublished versions deliver only within the team; listing approval is version-specific', () => {
  assert.equal(deploy().target.team_name, 'team');
  const external = { ...target, team_name: 'other-team' };
  assert.throws(() => deploy([], { target: external }), /teamOnly/);
  const approved = reviewListing(submit(), admin, 'approved', '', 'later');
  assert.equal(deploy([approved], { target: external }).target.team_name, 'other-team');
  assert.throws(() => deploy([approved], { target: external, template: { ...template, id: 'version-2' } }), /teamOnly/);
});
test('administrator test deployments may precede review and record actor and exact target without fake success', () => {
  const first = submit();
  const row = deploy([first], { user: admin, kind: 'test', listingId: first.id, target: { ...target, team_name: 'test-team', region_name: 'test-region' } });
  assert.equal(row.user_name, 'Administrator');
  assert.equal(row.target.region_name, 'test-region');
  assert.equal(row.status, 'requested');
  assert.equal(row.access_url, undefined);
  assert.throws(() => deploy([first], { kind: 'test' }), /forbidden/);
});
test('requesting an offline package does not grant premature cross-team deployment rights', () => {
  const row = deploy([], { kind: 'offline', target: null });
  assert.equal(row.kind, 'offline');
  assert.equal(row.status, 'requested');
  assert.equal(row.download_url, undefined);
  assert.throws(() => deploy([], { target: { ...target, team_name: 'other' } }), /teamOnly/);
});
test('test targets, queued/failed installs and offline exports are not delivered environments', () => {
  const rows = [
    { kind: 'test', status: 'requested', target }, { kind: 'test', status: 'succeeded', target },
    { kind: 'delivery', status: 'requested', target }, { kind: 'delivery', status: 'failed', target },
    { kind: 'offline', status: 'succeeded', target }
  ];
  assert.equal(successfulDeliveryEnvironments(rows).length, 0);
});
test('a successful team installation is an environment independently of pending market review', () => {
  const listing = submit(), installation = { ...deploy([listing]), status: 'succeeded' };
  assert.equal(listing.status, 'pending');
  assert.equal(successfulDeliveryEnvironments([installation])[0], installation);
});
test('environment summaries deduplicate successful installations without losing them after later failed work', () => {
  const installed = { id: 'installed', kind: 'delivery', status: 'succeeded', target, created_at: '2026-11-06T01:00:00Z' };
  const repeated = { ...installed, id: 'newer', created_at: '2026-11-06T02:00:00Z' };
  const failed = { ...installed, id: 'failed', status: 'failed', created_at: '2026-11-06T03:00:00Z' };
  const rows = [failed, installed, repeated];
  assert.equal(successfulDeliveryEnvironments(rows).length, 1);
  assert.equal(successfulDeliveryEnvironments(rows)[0].id, 'newer');
  assert.equal(rows[0], failed);
});
test('actions reject cross-enterprise identities and mismatched listing versions', () => {
  assert.throws(() => submitListing([], { user: { ...user, enterprise_id: 'other' }, scope, template, authorized: true, reason: 'Test' }, '', ''), /forbidden/);
  assert.throws(() => deploy([submit()], { user: admin, kind: 'test', listingId: 'unknown' }), /notFound/);
  assert.throws(() => submit([], { ...template, deleted_at: 'now' }), /versionUnavailable/);
});

test('application status and events use the captured source region and exclude unrelated applications', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const calls = [];
  const context = { require: require('node:module').createRequire(`${__dirname}/../services/deliveryCenter.js`), process: { env: {} }, apiconfig: { baseUrl: '' }, request: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/service/group')) return { list: [{ service_id: 'web', service_cname: 'Portal', status: 'running',
      git_url: 'https://user@example.com/web.git?ref=main', code_version: 'main', commit: '1234567', container_cpu: 0, min_memory: 1024, current_node: 0 }] };
    if (url.endsWith('/status')) return { bean: {}, list: { status: 'RUNNING', cpu: 0, memory: 1024, disk: 1048576 } };
    if (url.endsWith('/resources')) return { bean: {}, list: { cpu_request: 1000 } };
    if (url.endsWith('/operation-logs')) return { bean: { list: [
      { app_id: '1', team_name: 'team', region: 'region', operation_type: 'Build', comment: '构建 <a href="/#/apps/1">Portal</a> 完成' },
      { group_id: '2', operation_type: 'Other application' },
      { app_id: '1', region: 'other', operation_type: 'Other cluster' }
    ] }, list: [] };
    return { bean: { group_id: '1', group_name: 'Portal' } };
  } };
  const source = fs.readFileSync(`${__dirname}/../services/deliveryCenter.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  vm.runInNewContext(source, context);
  const result = await context.loadDeliveryCenter({ user: admin, kind: 'runtime', scope });
  assert.equal(result.bean.state.cpu, 0, 'zero usage is valid');
  assert.equal(result.bean.resources.cpu_request, 1000);
  const eventRequest = calls.find(call => call.url.endsWith('/operation-logs'));
  assert.match(eventRequest.url, /\/teams\/team\/apps\/1\/operation-logs$/);
  assert.equal(eventRequest.options.params.query, undefined, 'app identity must not be searched in comment text');
  assert.equal(result.bean.events.length, 1);
  assert.equal(result.bean.events[0].operation_type, 'Build');
  assert.equal(result.bean.events[0].comment_text, '构建 Portal 完成');
  assert.equal(result.bean.components.length, 1);
  assert.equal(result.bean.components[0].cpu_millicores, 0);
  assert.equal(result.bean.components[0].replicas, 0);
  assert.equal(result.bean.components[0].source, 'https://example.com/web.git');
  assert.equal(result.bean.components[0].memory_mib, 1024);
  calls.filter(call => call.url.includes('/teams/')).forEach(call => {
    assert.equal(call.options.method, 'get');
    assert.equal(call.options.params.region_name, 'region');
  });
});

test('development examples include complete version/runtime/deployment detail without replacing existing work', () => {
  const { seedDeliveryCenterSamples, deliverySampleRuntime, deliverySampleTargets } = require('../services/deliveryCenterSamples');
  const existing = submit();
  const seeded = seedDeliveryCenterSamples([existing], [], user.enterprise_id);
  assert.equal(seeded.listings.length, 7);
  assert.equal(listingGroups(seeded.listings).length, 4);
  assert.strictEqual(seeded.listings[0], existing);
  const examples = seeded.listings.filter(item => item.id.startsWith('preview-listing-'));
  assert.deepEqual([...new Set(examples.map(item => item.status))].sort(), ['approved', 'pending', 'rejected']);
  const edited = seeded.listings.map(item => item.id === examples[0].id ? { ...item, status: 'approved', review_comment: 'Reviewed now' } : item);
  const again = seedDeliveryCenterSamples(edited, seeded.deployments, user.enterprise_id);
  assert.strictEqual(again.listings, edited);
  assert.strictEqual(again.deployments, seeded.deployments);
  const runtime = deliverySampleRuntime(examples[0].source);
  assert.ok(runtime.events.length && runtime.state.cpu && runtime.resources.cpu_request);
  assert.equal(runtime.components.length, 3);
  assert.ok(runtime.components.every(component => component.status && component.source && component.memory_mib));
  assert.ok(deliverySampleTargets(examples[0].source).length > 1);
  assert.equal(deliverySampleRuntime(scope), null, 'real application runtime must never be replaced with example data');
  assert.ok(seeded.deployments.some(item => item.status === 'succeeded'));
});
