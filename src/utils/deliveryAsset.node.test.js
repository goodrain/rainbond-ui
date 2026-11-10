const test = require('node:test');
const assert = require('node:assert/strict');
const { repositoryLinks, safeSourceURL, imageInformation, assetSource, defaultComparison, environmentRecords, compareVersions } = require('./deliveryAsset');
const version = (memory, env = []) => ({ id: 'v1', components: [{ service_id: 'web', name: 'Web', source_type: 'source_code', source: 'https://github.com/example/app.git', branch: 'main', commit: 'abcdef1' }],
  component_overrides: [{ service_id: 'web', service_env_map_list: env, extend_method_map: { container_cpu: 0, init_memory: memory, min_node: 1, max_node: 3, step_node: 1 } }], manifest: { apps: [{ service_id: 'web' }] } });
test('source links support repositories and commits without exposing URL credentials', () => {
  const links = repositoryLinks('https://viewer:test-placeholder@github.com/example/app.git?private=hidden', '', 'abcdef1', 'feature/a');
  assert.equal(links.repository, 'https://github.com/example/app');
  assert.equal(links.commit, 'https://github.com/example/app/commit/abcdef1');
  assert.equal(safeSourceURL('git@gitlab.example.com:team/app.git'), 'https://gitlab.example.com/team/app.git');
  assert.equal(repositoryLinks('https://gitlab.example.com/team/app.git', '', 'abcdef1').commit, 'https://gitlab.example.com/team/app/-/commit/abcdef1');
  assert.equal(safeSourceURL('javascript:alert(1)'), '');
  assert.equal(repositoryLinks('https://unknown.example/team/app', '', 'abcdef1').commit, '');
});
test('image addresses preserve registry ports and digests', () => {
  const image = imageInformation('registry.example:5000/team/app:1.2.0');
  assert.equal(image.registry, 'registry.example:5000');assert.equal(image.repository, 'team/app');assert.equal(image.tag, '1.2.0');
  assert.equal(imageInformation('redis:7').registry, 'docker.io');
  assert.equal(imageInformation('registry.example/app@sha256:abcdef').tag, 'sha256:abcdef');
  assert.equal(assetSource({ service_id: 'web', service_source: 'source_code', git_url: 'https://github.com/example/app.git', code_branch: 'main', code_version: 'abcdef1' }).commit, 'abcdef1');
});
test('version comparison preserves zero quotas and ignores environment order without exposing secrets', () => {
  const before = version(0, [{ attr_name: 'MODE', attr_value: 'dev' }, { attr_name: 'PASSWORD', attr_value: 'test-before' }]);
  const after = version(512, [{ attr_name: 'PASSWORD', attr_value: 'test-after' }, { attr_name: 'MODE', attr_value: 'prod' }]);
  const copy = JSON.stringify(before), diff = compareVersions(before, after);
  assert.equal(diff.summary.updated, 1);
  assert.equal(diff.changes[0].fields.find(field => field.key === 'init_memory').before, 0);
  assert.equal(diff.changes[0].fields.find(field => field.key === 'env:MODE').after.value, 'prod');
  assert.equal(JSON.stringify(diff).includes('test-before'), false);assert.equal(JSON.stringify(diff).includes('test-after'), false);
  assert.equal(JSON.stringify(before), copy);
  assert.equal(compareVersions(after, { ...after, component_overrides: [{ ...after.component_overrides[0], service_env_map_list: after.component_overrides[0].service_env_map_list.slice().reverse() }] }).changes.length, 0);
});
test('comparison highlights component additions and application configuration changes', () => {
  const before = version(512), after = version(512);
  after.components.push({ service_id: 'cache', name: 'Cache', source_type: 'image', source: 'redis:7' });
  after.manifest.app_config_groups = [{ name: 'configuration', items: ['private-definition'] }];
  const diff = compareVersions(before, after);
  assert.equal(diff.summary.added, 1);assert.equal(diff.summary.application, 1);
  assert.equal(JSON.stringify(diff).includes('private-definition'), false);
});
test('version changes compare the immediately preceding version regardless of review status', () => {
  const items = [['3', 'pending', '2026-11-09'], ['2', 'pending', '2026-11-08'], ['1', 'approved', '2026-11-07']].map(([id, status, created_at]) => ({ status, template: { id, version: id, created_at } }));
  assert.equal(defaultComparison(items, items[0]).template.id, '2');
  assert.equal(defaultComparison(items, items[1]).template.id, '1');
  assert.equal(defaultComparison(items, items[2]), null);
});
test('runtime environments require an actual target app and retain version provenance', () => {
  const source = { enterprise_id: 'e', teamName: 'team', regionName: 'r', appID: '1' };
  const environments = environmentRecords(source, [
    { id: 'queued', kind: 'test', status: 'queued', target: { team_name: 'qa', region_name: 'r' } },
    { id: 'installed', kind: 'test', status: 'succeeded', template_id: 'v1', target: { team_name: 'qa', region_name: 'r', app_id: '2', app_name: 'Test' } },
    { id: 'export', kind: 'offline', status: 'succeeded' }
  ], [{ template: { id: 'v1', version: '1.0.0' } }]);
  assert.equal(environments.length, 2);assert.equal(environments[1].origins[0].version, '1.0.0');assert.equal(environments[1].scope.appID, '2');
});
test('view template resolves only completed local publication of the selected version', () => {
  const { localMarketTemplatePath } = require('./deliveryAsset');
  const current = { status: 'approved', publication_status: 'publishing', enterprise_id: 'e', destination: { type: 'local' }, template: { id: 'v1', template_id: 'abc-def' } };
  assert.equal(localMarketTemplatePath('e', current, [current]), '');
  const published = { ...current, publication_status: 'published' };
  assert.equal(localMarketTemplatePath('e', published, [published]), '/enterprise/e/shared/app/abcdef');
  assert.equal(localMarketTemplatePath('other', published, [published]), '');
  assert.equal(localMarketTemplatePath('e', current, [{ ...published, template: { ...published.template, id: 'v2' } }]), '');
  const market = { ...published, destination: { type: 'market', market_id: 'remote' }, history: [published] };
  assert.equal(localMarketTemplatePath('e', market, [market]), '/enterprise/e/shared/app/abcdef');
  assert.equal(localMarketTemplatePath('e', { ...market, history: [] }, []), '');
});
