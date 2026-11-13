const test = require('node:test');
const assert = require('node:assert/strict');
const { submitListing, reviewListing, recordDelivery, listingGroups, successfulDeliveryEnvironments,
  listingRequiresReview, listingDeployable, latestPublications } = require('./deliveryWorkflow');
const { deliveryScope } = require('./templateDelivery');
const scope = { enterprise_id: 'enterprise', teamName: 'team', regionName: 'region', appID: '1' };
const user = { enterprise_id: 'enterprise', user_id: 10, nick_name: 'Applicant' };
const admin = { ...user, user_id: 1, nick_name: 'Administrator', is_enterprise_admin: true };
const template = { id: 'version-1', scope: deliveryScope(scope), template_name: 'Portal', version: '1.0.0',
  component_overrides: [{ service_id: 'web', service_env_map_list: [{ attr_name: 'MODE', attr_value: 'production' }] }], components: [{ service_id: 'web' }] };
const submit = (items = [], tpl = template, id = 'listing-1') => submitListing(items, { user, scope, template: tpl, reason: 'Publish portal', authorized: true, appName: 'Portal app' }, '2026-11-06', id);
const target = { team_name: 'team', region_name: 'region', app_name: 'portal-test' };
const deploy = (listings = [], overrides = {}) => recordDelivery([], { user, scope, template, authorized: true, kind: 'delivery', target, ...overrides }, listings, '2026-11-06', 'deployment-1');

test('online publications do not count as pending review and do not hide a local review for the same version', () => {
  const local = { ...submit(), destination: {type:'local'} };
  const online = { ...local, id:'online',status:'not_required',destination:{type:'market',market_id:'store'},publication_status:'publishing',submitted_at:'2026-11-07' };
  assert.equal(listingRequiresReview(online),false);
  assert.equal(listingDeployable(online),false);
  assert.equal(listingDeployable({...online,publication_status:'published'}),true);
  const group=listingGroups([online,local])[0];
  assert.equal(group.pending,1);
  assert.equal(group.versions.length,1);
  assert.equal(group.versions[0].id,local.id);
  assert.equal(group.versions[0].history[0].id,online.id);
  assert.equal(latestPublications([online,local]).length,2);
  assert.equal(listingGroups([{...online,status:'pending'}])[0].pending,0);
});

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

test('runtime loads source component status without eagerly requesting component event histories', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const calls = [];
  const context = { require: require('node:module').createRequire(`${__dirname}/../services/deliveryCenter.js`), process: { env: {} }, apiconfig: { baseUrl: '' }, request: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/service/group')) return { list: [{ service_id: 'web', service_cname: 'Portal', status: 'running',
      git_url: 'https://user@example.com/web.git?ref=main', code_version: 'main', commit: '1234567', container_cpu: 0, min_memory: 1024, current_node: 0, update_time: '2026-11-10T01:00:00Z' }] };
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
  assert.equal(calls.some(call => call.url.endsWith('/events') || call.url.endsWith('/operation-logs')), false);
  assert.equal(result.bean.components.length, 1);
  assert.equal(result.bean.components[0].cpu_millicores, 0);
  assert.equal(result.bean.components[0].replicas, 0);
  assert.equal(result.bean.components[0].source, 'https://example.com/web.git');
  assert.equal(result.bean.components[0].memory_mib, 1024);
  assert.equal(result.bean.components[0].updated_at, '2026-11-10T01:00:00Z');
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

test('component event pages use the selected alias and filter unrelated component records', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const calls = [];
  const context = { require: require('node:module').createRequire(`${__dirname}/../services/deliveryCenter.js`), apiconfig: { baseUrl: '' }, request: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/service/group')) return { list: [{ service_id: 'web', service_alias: 'web-alias', service_cname: 'Web' }] };
    if (url.endsWith('/operation-logs')) return { list: [{ ID: 1, comment: '更新 <b>资源</b>', create_time: '2026-11-10T01:00:00Z', username: 'owner' }] };
    if (url.endsWith('/events') && options.params.targetAlias === 'web-alias') return { list: [
      { event_id: 'build', app_id: 'region-application-uuid', region: 'region-uuid', target: 'service', target_id: 'web', type_cn: '构建', message: '构建完成', status: 'success', start_time: '2026-11-10T02:00:00Z', user_name: 'builder' },
      { event_id: 'unrelated', target: 'service', target_id: 'another', message: 'Unrelated component' }
    ] };
    return { bean: {} };
  } };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../services/deliveryCenter.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  const result = await context.loadDeliveryCenter({ user: admin, kind: 'componentEvents', scope,
    component: { service_id: 'web', service_alias: 'web-alias', name: 'Web' }, page: 2 });
  assert.equal(result.bean.items.length, 1);
  assert.equal(result.bean.items[0].component_name, 'Web');
  assert.equal(result.bean.items[0].comment_text, '构建完成');
  assert.equal(result.bean.items[0].created_at, '2026-11-10T02:00:00Z');
  assert.equal(result.bean.items[0].service_id, 'web');
  assert.equal(result.bean.has_more, false);
  const request = calls.find(call => call.url.endsWith('/events') && call.options.params.targetAlias === 'web-alias');
  assert.equal(request.options.params.region_name, scope.regionName);
  assert.equal(request.options.params.page, 2);
  assert.equal(request.options.params.page_size, 20);
  assert.equal(request.options.params.target, 'service');
  assert.equal(request.options.params.targetAlias, 'web-alias');
  assert.equal(request.options.timeout, 12000);
  assert.equal(request.options.method, 'get');
  assert.equal(calls.length, 1);

});

test('build history keeps the server total and requested page instead of treating the loaded page as all records', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const calls = [];
  const context = { require: require('node:module').createRequire(`${__dirname}/../services/deliveryCenter.js`), apiconfig: { baseUrl: '' },
    getAppVersionList: async params => { calls.push(params);return { list: [{ build_version: '8', code_version: 'abcdef1', code_commit_msg: 'Fix' }], total: '26', bean: { current_version: '8' } }; } };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../services/deliveryCenter.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  const result = await context.loadDeliveryCenter({ kind: 'buildHistory', scope, component: { service_alias: 'web' }, page: 3 });
  assert.equal(result.bean.total, 26);
  assert.equal(result.bean.records.length, 1);
  assert.equal(result.bean.page, 3);
  assert.equal(calls[0].page_num, 3);
  assert.equal(calls[0].region_name, scope.regionName);
});

test('component event failure is independent of source component status', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const context = { require: require('node:module').createRequire(`${__dirname}/../services/deliveryCenter.js`), apiconfig: { baseUrl: '' }, request: async url => {
    if (url.endsWith('/service/group')) return { list: [{ service_id: 'web', service_alias: 'web', service_cname: 'Web' }] };
    if (url.endsWith('/events')) throw new Error('unavailable');
    if (url.endsWith('/operation-logs')) return { list: [{ app_id: '1', comment: '更新资源', create_time: '2026-11-10T01:00:00Z' }] };
    return { bean: {} };
  } };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../services/deliveryCenter.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  const result = await context.loadDeliveryCenter({ kind: 'runtime', user: admin, scope });
  assert.equal(result.bean.components.length, 1);
  assert.equal(result.bean.components[0].updated_at, null);
  await assert.rejects(() => context.loadDeliveryCenter({ kind: 'componentEvents', user: admin, scope,
    component: result.bean.components[0] }), /unavailable/);

});


test('component events retain their own scope and history when event IDs overlap', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const context = { require: require('node:module').createRequire(`${__dirname}/../services/deliveryCenter.js`), apiconfig: { baseUrl: '' }, request: async (url, options) => {
    if (url.endsWith('/service/group')) return { list: [
      { service_id: 'web', service_alias: 'web', service_cname: 'Web' },
      { service_id: 'api', service_alias: 'api', service_cname: 'API' }
    ] };
    if (url.endsWith('/events') && options.params.targetAlias === 'web') return { list: [{ event_id: 'shared', message: 'Web built', start_time: '2026-11-10T01:00:00Z' }] };
    if (url.endsWith('/events') && options.params.targetAlias === 'api') return { list: [
      { event_id: 'shared', message: 'API started', start_time: '2026-11-10T02:00:00Z' },
      { event_id: 'wrong', service_id: 'web', message: 'Wrong component' }
    ] };
    if (url.endsWith('/operation-logs')) return { list: [{ id: 'app-only', comment: 'Application operation' }] };
    return { bean: {} };
  } };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../services/deliveryCenter.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  const web = await context.loadDeliveryCenter({ kind: 'componentEvents', user: admin, scope,
    component: { service_id: 'web', service_alias: 'web', name: 'Web' } });
  const api = await context.loadDeliveryCenter({ kind: 'componentEvents', user: admin, scope,
    component: { service_id: 'api', service_alias: 'api', name: 'API' } });
  assert.equal(web.bean.items[0].comment_text, 'Web built');
  assert.equal(api.bean.items.length, 1);
  assert.equal(api.bean.items[0].comment_text, 'API started');
  assert.notEqual(web.bean.items[0].id, api.bean.items[0].id);
  assert.ok([...web.bean.items, ...api.bean.items].every(event => event.comment_text !== 'Application operation'));

});


test('component event paging respects the existing API has_next flag without requiring a total', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const context = { require: require('node:module').createRequire(`${__dirname}/../services/deliveryCenter.js`), apiconfig: { baseUrl: '' },
    request: async (url, options) => ({ list: [{ event_id: 'event', message: 'Completed' }], has_next: options.params.page === 1 }) };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../services/deliveryCenter.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  const input = { kind: 'componentEvents', scope, component: { service_id: 'web', service_alias: 'web', name: 'Web' } };
  const first = await context.loadDeliveryCenter(input);
  assert.equal(first.bean.has_more, true);
  assert.equal(first.bean.total, undefined);
  const last = await context.loadDeliveryCenter({ ...input, page: 2 });
  assert.equal(last.bean.has_more, false);
});


test('application access uses the overview visit endpoint with the captured source cluster', async () => {
  const fs = require('node:fs'), vm = require('node:vm'), calls = [];
  const links = [{ access_info: [{ service_cname: 'Web', access_urls: ['https://app.example.test'] }] }];
  const context = { require: require('node:module').createRequire(`${__dirname}/../services/deliveryCenter.js`), apiconfig: { baseUrl: '' }, request: async (url, options) => {
    calls.push({ url, options });return { list: links };
  } };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../services/deliveryCenter.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  const result = await context.loadDeliveryCenter({ kind: 'access', scope, components: [{ service_alias: 'web' }, { service_alias: 'api' }] });
  assert.equal(calls[0].url, '/console/teams/team/group/service/visit');
  assert.equal(calls[0].options.params.service_alias, 'web-api');
  assert.equal(calls[0].options.params.region_name, 'region');
  assert.equal(result.bean.list, links);
  const empty = await context.loadDeliveryCenter({ kind: 'access', scope, components: [] });
  assert.equal(empty.bean.list.length, 0);assert.equal(calls.length, 1);
});

test('local listing actions replace the list button across review, publication and withdrawal states', () => {
  const { localListingAction } = require('./deliveryWorkflow');
  const local = { id: 'local', destination: { type: 'local' }, status: 'pending', publication_status: 'not_started', submitted_at: '2026-11-13T01:00:00Z' };
  assert.equal(localListingAction([]).label, 'listAction');
  assert.equal(localListingAction([local]).label, 'cancelListingRequest');
  assert.equal(localListingAction([local]).action, 'cancel');
  assert.equal(localListingAction([{ ...local, status: 'approved', publication_status: 'publishing' }]).label, 'unlistAction');
  const published = { ...local, status: 'approved', publication_status: 'published' };
  assert.equal(localListingAction([published]).action, 'unlist');
  for (const publication_status of ['cancelled', 'unlisted']) {
    const withdrawn = { ...published, publication_status };
    assert.equal(localListingAction([withdrawn]).kind, 'listing');
    assert.equal(localListingAction([withdrawn]).label, 'relistAction');
    assert.equal(listingDeployable(withdrawn), false);
  }
});
test('a new local request supersedes old withdrawal history independently of online store sync', () => {
  const { localListingAction } = require('./deliveryWorkflow');
  const old = { id: 'old', destination: { type: 'local' }, status: 'approved', publication_status: 'unlisted', submitted_at: '2026-11-12' };
  const current = { ...old, id: 'new', status: 'pending', publication_status: 'not_started', submitted_at: '2026-11-13' };
  const online = { ...old, id: 'online', destination: { type: 'market', market_id: 'store' }, status: 'not_required', publication_status: 'published', submitted_at: '2026-11-14' };
  assert.equal(localListingAction([old, current, online]).listing.id, 'new');
  assert.equal(localListingAction([old, current, online]).label, 'cancelListingRequest');
  assert.equal(localListingAction([online]).label, 'listLocalAction');
  assert.equal(listingDeployable(online), true);
});
test('withdrawal API carries the selected application version, request and confirmed action', async () => {
  const fs = require('node:fs'), vm = require('node:vm'), parser = require('@babel/parser');
  const source = fs.readFileSync(`${__dirname}/../services/deliveryCenter.js`, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module' });
  const declaration = ast.program.body.find(node => node.type === 'ExportNamedDeclaration' && node.declaration.id && node.declaration.id.name === 'actOnDelivery').declaration;
  let request;
  const act = vm.runInNewContext(`${source.slice(declaration.start, declaration.end)};actOnDelivery`, {
    base: () => '/app/delivery-templates', request: async (url, options) => { request = { url, options }; }
  });
  await act({ operation: 'withdraw', action: 'unlist', scope: { regionName: 'region' }, template: { id: 'version-1' }, requestId: 'listing-1' });
  assert.equal(request.url, '/app/delivery-templates/versions/version-1/listing-requests/listing-1/withdraw');
  assert.equal(request.options.method, 'post');
  assert.equal(request.options.data.region_name, 'region');
  assert.equal(request.options.data.action, 'unlist');
});
