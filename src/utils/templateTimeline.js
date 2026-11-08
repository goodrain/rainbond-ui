const { deliveryScope } = require('./templateDelivery');
const copy = value => JSON.parse(JSON.stringify(value));
const stable = value => JSON.stringify(order(value));
function order(value) {
  if (Array.isArray(value)) return value.map(order);
  if (value && typeof value === 'object') return Object.keys(value).sort().reduce((result, key) => {
    if (value[key] !== undefined) result[key] = order(value[key]);
    return result;
  }, {});
  return value;
}
function sourceBaseline(components, configs) {
  return { schema: 1, components: components.map(component => {
    const config = configs[component.service_id];
    if (!config) throw new Error('delivery.configIncomplete');
    return { service_id: component.service_id, name: component.name, source_type: component.source_type,
      source: component.source || '', branch: component.branch || '', commit: component.commit || '', revision: component.revision || '',
      vm: component.vm ? { boot_source_format: component.vm.boot_source_format, architecture: component.vm.architecture } : null, extend_method: config.extend_method,
      environment: config.service_env_map_list.map(env => ({ name: env.attr_name, value: env.is_sensitive ? '' : env.attr_value,
        sensitive: !!env.is_sensitive })).sort((a, b) => a.name.localeCompare(b.name)),
      scaling: config.extend_method === 'vm' ? null : copy(config.extend_method_map) };
  }).sort((a, b) => String(a.service_id).localeCompare(String(b.service_id))) };
}
function compareSource(baseline, current) {
  if (!baseline || baseline.schema !== 1 || !current || current.schema !== 1) return { status: 'unknown', details: [], summary: {} };
  const before = new Map(baseline.components.map(item => [item.service_id, item])), after = new Map(current.components.map(item => [item.service_id, item]));
  const details = [];
  after.forEach((item, id) => {
    const old = before.get(id);
    if (!old) details.push({ service_id: id, name: item.name, type: 'added', fields: [] });
    else {
      const fields = [];
      if (stable([old.name, old.source_type, old.source, old.branch, old.commit, old.vm]) !== stable([item.name, item.source_type, item.source, item.branch, item.commit, item.vm])) fields.push('source');
      if (stable(old.environment) !== stable(item.environment)) fields.push('environment');
      if (stable([old.scaling, old.extend_method]) !== stable([item.scaling, item.extend_method])) fields.push('resources');
      if (old.revision !== item.revision) fields.push('configuration');
      if (fields.length) details.push({ service_id: id, name: item.name, type: 'updated', fields });
    }
  });
  before.forEach((item, id) => { if (!after.has(id)) details.push({ service_id: id, name: item.name, type: 'removed', fields: [] }); });
  return { status: details.length ? 'changed' : 'unchanged', details,
    summary: { added_count: details.filter(item => item.type === 'added').length,
      updated_count: details.filter(item => item.type === 'updated').length, removed_count: details.filter(item => item.type === 'removed').length } };
}
function templateGroups(records) {
  const groups = new Map();
  records.forEach(record => {
    const id = record.template_id || `${record.scope}:${record.template_name}`;
    const group = groups.get(id) || { id, template_name: record.template_name, versions: [] };
    group.versions.push(record);groups.set(id, group);
  });
  return Array.from(groups.values()).map(group => {
    const versions = group.versions.slice().sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) || String(b.id).localeCompare(String(a.id)));
    return { ...group, template_name: versions[0].template_name, versions, latest: versions.find(item => !item.deleted_at) || null };
  }).sort((a, b) => (Date.parse(b.versions[0].created_at) || 0) - (Date.parse(a.versions[0].created_at) || 0));
}
function nextTemplateVersion(version) {
  if (Array.isArray(version)) version = version.slice().sort((a, b) => {
    const left = String(a).split('.').map(Number), right = String(b).split('.').map(Number);
    for (let index = 0; index < 3; index += 1) { const difference = (right[index] || 0) - (left[index] || 0);if (difference) return difference; }
    return 0;
  })[0];
  const match = String(version || '').match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);
  return match ? `${match[1]}.${match[2]}.${Number(match[3] || 0) + 1}` : '1.0.0';
}
function deleteTemplateVersion(records, { scope, user, templateId, authorized }, now) {
  if (!authorized || !user || String(user.enterprise_id) !== String(scope.enterprise_id)) throw new Error('delivery.permissionRequired');
  const record = records.find(item => item.id === templateId && item.scope === deliveryScope(scope));
  if (!record || record.deleted_at) throw new Error('delivery.versionUnavailable');
  return records.map(item => item === record ? { ...item, deleted_at: now, deleted_by: user.nick_name || user.user_name || String(user.user_id) } : item);
}
module.exports = { sourceBaseline, compareSource, templateGroups, nextTemplateVersion, deleteTemplateVersion };
