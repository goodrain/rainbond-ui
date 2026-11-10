const { sensitiveName } = require('./templateDelivery');
const unorderedKeys = new Set(['service_env_map_list', 'service_volume_map_list', 'port_map_list', 'dep_service_map_list',
  'mnt_relation_list', 'component_keys', 'plugins', 'app_config_groups', 'ingress_http_routes', 'k8s_resources']);
const ordered = (value, unordered = false) => {
  if (Array.isArray(value)) {
    const list = value.map(item => ordered(item));
    return unordered ? list.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : list;
  }
  if (value && typeof value === 'object') return Object.keys(value).sort().reduce((result, key) => {
    result[key] = ordered(value[key], unorderedKeys.has(key));return result;
  }, {});
  return value;
};
const equal = (a, b) => JSON.stringify(ordered(a, Array.isArray(a))) === JSON.stringify(ordered(b, Array.isArray(b)));
function safeSourceURL(value) {
  let address = String(value || '').trim();
  const ssh = address.match(/^(?:[^@/]+@)([^:/]+):(.+)$/);
  if (ssh) address = `https://${ssh[1]}/${ssh[2]}`;
  try {
    const url = new URL(address);
    if (url.protocol === 'ssh:') return safeSourceURL(`https://${url.host}${url.pathname}`);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    url.username = '';url.password = '';url.search = '';url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch (error) { return ''; }
}
function repositoryLinks(address, hint, commit, branch) {
  const repository = safeSourceURL(address).replace(/\.git$/, '');
  if (!repository) return { repository: '', commit: '', history: '' };
  const host = new URL(repository).hostname;
  const provider = `${hint || ''} ${host}`.toLowerCase();
  const gitlab = provider.includes('gitlab');
  const known = gitlab || provider.includes('github') || provider.includes('gitee');
  return { repository,
    commit: known && /^[a-f0-9]{7,40}$/i.test(commit || '') ? `${repository}${gitlab ? '/-/commit/' : '/commit/'}${commit}` : '',
    history: known && branch ? `${repository}${gitlab ? '/-/commits/' : '/commits/'}${encodeURIComponent(branch)}` : '' };
}
function repositoryComparison(before, after) {
  const first = repositoryLinks(before.repository, before.provider, before.commit, before.branch);
  const second = repositoryLinks(after.repository, after.provider, after.commit, after.branch);
  if (!first.commit || !second.commit || first.repository !== second.repository) return '';
  return `${first.repository}${`${before.provider || ''} ${first.repository}`.toLowerCase().includes('gitlab') ? '/-/compare/' : '/compare/'}${before.commit}...${after.commit}`;
}
function imageInformation(value) {
  let address = String(value || '').trim();
  if (/^[a-z]+:\/\//i.test(address)) address = safeSourceURL(address).replace(/^https?:\/\//, '');
  const slash = address.indexOf('/'), at = address.indexOf('@');
  if (at >= 0 && (slash < 0 || at < slash)) address = address.slice(at + 1);
  const first = address.split('/')[0];
  const hasRegistry = address.includes('/') && (first.includes('.') || first.includes(':') || first === 'localhost');
  const registry = hasRegistry ? first : 'docker.io';
  const path = hasRegistry ? address.slice(first.length + 1) : address;
  const digest = path.includes('@') ? path.split('@')[1] : '';
  const tagIndex = path.lastIndexOf(':');
  const repository = digest ? path.split('@')[0] : tagIndex >= 0 ? path.slice(0, tagIndex) : path;
  return { address, registry, repository, tag: digest || (tagIndex >= 0 ? path.slice(tagIndex + 1) : '') };
}
function assetSource(component) {
  const kind = component.vm || component.extend_method === 'vm' ? 'vm' : (component.source_type || component.service_source) === 'source_code' ? 'code' :
    (component.source_type || component.service_source) === 'package_build' ? 'file' : 'image';
  const source = component.source || component.git_url || component.image || '';
  const repository = kind === 'code' ? safeSourceURL(component.git_url || source) : '';
  const image = kind !== 'code' ? imageInformation(component.delivered_path || component.share_image || component.image || source) : imageInformation(component.delivered_path || component.share_image || '');
  return { service_id: String(component.service_id), service_alias: component.service_alias || '', name: component.name || component.service_cname || component.service_alias,
    kind, repository, provider: component.git_type || component.code_from || '',
    branch: component.code_branch || component.branch || '', commit: component.commit || component.code_commit || (component.code_branch ? component.code_version : '') || '',
    buildVersion: component.deploy_version || component.build_version || '', image, archived: !!component.archived };
}
function versionSources(template) {
  const manifest = template && template.manifest || {};
  return (template && template.components || manifest.apps || []).map(component => assetSource({
    ...(manifest.apps || []).find(item => item.service_id === component.service_id), ...component
  }));
}
function buildRecord(item) {
  return { id: item.build_version || item.event_id || item.ID, buildVersion: item.build_version || '', status: item.status || '',
    commit: item.code_version || '', branch: item.code_branch || '', message: item.code_commit_msg || '',
    author: item.code_commit_author || item.build_user || item.user_name || item.username || item.create_user || '', createdAt: item.create_time || item.created_at || '',
    image: imageInformation([item.image_domain, item.image_repo].filter(Boolean).join('/') + (item.image_tag ? `:${item.image_tag}` : '')) };
}
function orderedVersions(items) {
  return items.slice().sort((a, b) => (Date.parse(b.template.created_at || b.submitted_at) || 0) - (Date.parse(a.template.created_at || a.submitted_at) || 0) ||
    String(b.template.version).localeCompare(String(a.template.version), undefined, { numeric: true }));
}
function defaultComparison(items, selected) {
  const versions = orderedVersions(items), index = versions.findIndex(item => item.template.id === selected.template.id);
  return index >= 0 ? versions[index + 1] || null : null;
}
function environmentRecords(source, tasks, versions) {
  const key = scope => [scope.teamName, scope.regionName, scope.appID].join(':');
  const result = new Map([[key(source), { key: key(source), kind: 'source', scope: source, name: '', origins: [] }]]);
  tasks.slice().sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0)).forEach(task => {
    if (!['delivery', 'test'].includes(task.kind) || !task.target || !task.target.app_id) return;
    const scope = { enterprise_id: source.enterprise_id, teamName: task.target.team_name, regionName: task.target.region_name, appID: String(task.target.app_id) };
    const id = key(scope), version = versions.find(item => item.template.id === task.template_id);
    const origin = { versionId: task.template_id, version: version ? version.template.version : task.version, taskId: task.id, status: task.status };
    if (result.has(id)) result.get(id).origins.push(origin);
    else result.set(id, { key: id, kind: task.kind, scope, name: task.target.app_name || '', origins: [origin] });
  });
  return Array.from(result.values());
}
function environmentValue(env) {
  if (env.is_sensitive || env.required_on_install || sensitiveName(env.attr_name)) return { value: '', install: true };
  const value = String(env.attr_value == null ? '' : env.attr_value);
  try { if (new URL(value).password) return { value: '', install: true }; } catch (error) { /* regular variable */ }
  return { value, install: false };
}
function componentState(template, component) {
  const manifest = (template.manifest && template.manifest.apps || []).find(item => item.service_id === component.service_id) || {};
  const config = (template.component_overrides || []).find(item => item.service_id === component.service_id) || manifest;
  const source = assetSource({ ...manifest, ...component });
  const scaling = config.extend_method_map || {};
  const env = (config.service_env_map_list || []).reduce((result, item) => { result[item.attr_name] = environmentValue(item);return result; }, {});
  return { name: source.name, source, scaling, env, manifest };
}
function compareVersions(before, after) {
  if (!before || !after) return { available: false, changes: [], summary: { added: 0, removed: 0, updated: 0, application: 0 } };
  const left = new Map((before.components || []).map(component => [component.service_id, componentState(before, component)]));
  const right = new Map((after.components || []).map(component => [component.service_id, componentState(after, component)]));
  const changes = [];
  new Set([...left.keys(), ...right.keys()]).forEach(id => {
    const old = left.get(id), next = right.get(id), fields = [];
    const add = (key, first, second, format = 'text', name) => { if (!equal(first, second)) fields.push({ key, before: first, after: second, format, name }); };
    if (!old || !next) { changes.push({ id, name: (next || old).name, type: next ? 'added' : 'removed', fields });return; }
    add('componentName', old.name, next.name);
    ['repository', 'branch', 'commit', 'buildVersion'].forEach(key => add(key, old.source[key], next.source[key]));
    add('imageAddress', old.source.image.address, next.source.image.address);
    ['container_cpu', 'init_memory', 'min_node', 'max_node', 'step_node'].forEach(key => add(key, old.scaling[key], next.scaling[key], key === 'container_cpu' ? 'cpu' : key === 'init_memory' ? 'memory' : 'number'));
    new Set([...Object.keys(old.env), ...Object.keys(next.env)]).forEach(name => add(`env:${name}`, old.env[name], next.env[name], 'env', name));
    ['port_map_list', 'dep_service_map_list', 'service_volume_map_list', 'mnt_relation_list'].forEach(key => {
      if (!equal(old.manifest[key] || [], next.manifest[key] || [])) fields.push({ key, before: (old.manifest[key] || []).length, after: (next.manifest[key] || []).length, format: 'configuration' });
    });
    if (fields.length) changes.push({ id, name: next.name, type: 'updated', fields, sourceBefore: old.source, sourceAfter: next.source });
  });
  const oldManifest = before.manifest || {}, newManifest = after.manifest || {};
  const application = [];
  ['k8s_resources', 'app_config_groups', 'ingress_http_routes', 'plugins'].forEach(key => {
    if (!equal(oldManifest[key] || [], newManifest[key] || [])) application.push({ key,
      before: (oldManifest[key] || []).length, after: (newManifest[key] || []).length, format: 'configuration' });
  });
  if (application.length) changes.push({ id: 'application', name: '', type: 'application', fields: application });
  return { available: true, changes, summary: ['added', 'removed', 'updated', 'application'].reduce((result, type) => ({ ...result, [type]: changes.filter(item => item.type === type).length }), {}) };
}
function localMarketTemplatePath(enterpriseId, selected, versions = []) {
  if (!selected || selected.template.deleted_at) return '';
  const publications = [selected, ...versions].flatMap(row => [row, ...(row.history || [])]);
  const local = publications.find(row => row.template.id === selected.template.id && row.status === 'approved' &&
    row.publication_status === 'published' && row.destination && row.destination.type === 'local' &&
    (!row.enterprise_id || String(row.enterprise_id) === String(enterpriseId)));
  return local && local.template.template_id ? `/enterprise/${encodeURIComponent(enterpriseId)}/shared/app/${encodeURIComponent(local.template.template_id.replace(/-/g, ''))}` : '';
}
module.exports = { safeSourceURL, repositoryLinks, repositoryComparison, imageInformation, assetSource, versionSources, buildRecord,
  orderedVersions, defaultComparison, environmentRecords, compareVersions, localMarketTemplatePath };
