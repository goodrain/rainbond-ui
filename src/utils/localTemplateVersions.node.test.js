const test = require('node:test');
const assert = require('node:assert/strict');
const { localTemplateVersion } = require('./localTemplateVersions');
const { compareVersions } = require('./deliveryAsset');
const record = (version, extra = {}) => ({ ID: version, app_id: 'catalog', version, app_version_info: 'Release notes', create_time: '2026-11-10T01:00:00Z',
  app_template: { group_name: 'App', group_version: version, arch: 'arm64', apps: [{ service_id: `runtime-${version}`, service_key: 'web', service_cname: 'Web',
    service_source: 'source_code', git_url: 'https://example.test/app.git', code_branch: 'main', code_version: '1234567',
    service_env_map_list: [{ attr_name: 'MODE', attr_value: 'production' }, { attr_name: 'PASSWORD', attr_value: '$SOURCE_VALUE' }],
    extend_method_map: { min_node: 1, max_node: 3, step_node: 1, init_memory: 0, container_cpu: 0 } }] }, ...extra });

test('catalog JSON normalizes into the existing immutable template view without mutating source data', () => {
  const row = record('1.0.0'), before = JSON.stringify(row);
  const normalized = localTemplateVersion({ ...row, arch: 'amd64', app_template: JSON.stringify(row.app_template) });
  assert.equal(normalized.components[0].service_id, 'web');
  assert.equal(normalized.components[0].branch, 'main');
  assert.equal(normalized.components[0].commit, '1234567');
  assert.equal(normalized.description, 'Release notes');
  assert.equal(normalized.arch, 'arm64');
  assert.equal(normalized.created_at, row.create_time);
  assert.equal(normalized.component_overrides[0].extend_method_map.container_cpu, 0);
  assert.equal(normalized.component_overrides[0].extend_method_map.init_memory, 0);
  assert.equal(JSON.stringify(normalized).includes('$SOURCE_VALUE'), false);
  assert.equal(JSON.stringify(row), before);
});

test('legacy quotas use actual saved fields and missing replica limits remain unknown', () => {
  const row = record('1.0.0'), component = row.app_template.apps[0];
  delete component.extend_method_map;
  component.cpu = '500';component.memory = '1024';
  const settings = localTemplateVersion(row).component_overrides[0].extend_method_map;
  assert.equal(settings.container_cpu, 500);assert.equal(settings.init_memory, 1024);
  assert.equal(settings.min_node, undefined);assert.equal(settings.max_node, undefined);assert.equal(settings.step_node, undefined);
});

test('stable market component keys compare consecutive versions even if original runtime IDs differ', () => {
  const before = record('1.0.0'), after = record('1.0.1');
  after.app_template.apps[0].extend_method_map.container_cpu = 500;
  const diff = compareVersions(localTemplateVersion(before), localTemplateVersion(after));
  assert.equal(diff.summary.added, 0);assert.equal(diff.summary.removed, 0);assert.equal(diff.summary.updated, 1);
  assert.equal(diff.changes[0].fields.find(field => field.key === 'container_cpu').before, 0);
});

test('VM and DaemonSet configuration stays distinct and missing dates stay missing', () => {
  const row = record('1.0.0', { create_time: null });
  row.app_template.apps[0].vm = { boot_source_format: 'qcow2' };
  assert.equal(localTemplateVersion(row).component_overrides[0].extend_method, 'vm');
  assert.equal(localTemplateVersion(row).components[0].vm.boot_source_format, 'qcow2');
  delete row.app_template.apps[0].vm;
  row.app_template.apps[0].extend_method = 'daemonset';
  assert.equal(localTemplateVersion(row).component_overrides[0].extend_method, 'daemonset');
  assert.equal(localTemplateVersion(row).created_at, null);
});

test('missing or invalid manifests do not generate sample components or a fabricated empty template', () => {
  for (const app_template of [undefined, '', '{invalid', null, {}, { apps: [{}] }, { apps: [null] }]) {
    assert.equal(localTemplateVersion({ version: '1.0.0', app_template }), null);
  }
});
