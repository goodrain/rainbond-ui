const { normalizeTemplateConfig } = require('./templateDelivery');

function localTemplateVersion(record) {
  let manifest;
  try { manifest = typeof record.app_template === 'string' ? JSON.parse(record.app_template) : record.app_template; }
  catch (error) { return null; }
  if (!manifest || !Array.isArray(manifest.apps)) return null;
  if (manifest.apps.some(component => !component || typeof component !== 'object' ||
    !component.service_key && !component.service_share_uuid && !component.service_id)) return null;
  const apps = manifest.apps.map(component => ({ ...component,
    service_id: String(component.service_key || component.service_share_uuid || component.service_id),
    service_cname: component.service_cname || component.name || component.service_alias || '—'
  }));
  const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? undefined : Number(value);
  const configs = apps.map(component => {
    const saved = component.extend_method_map || {};
    const scaling = {};
    ['min_node', 'max_node', 'step_node'].forEach(key => { scaling[key] = number(saved[key] == null ? component[key] : saved[key]); });
    scaling.init_memory = number(saved.init_memory == null ? component.memory : saved.init_memory);
    scaling.container_cpu = number(saved.container_cpu == null ? component.cpu : saved.container_cpu);
    return normalizeTemplateConfig({ ...component, extend_method_map: scaling }, component.service_env_map_list || []);
  });
  const annotations = manifest.annotations || {};
  return {
    id: String(record.ID || record.id || `${record.app_id}:${record.version}`),
    version: String(record.version || manifest.group_version || ''),
    template_name: manifest.group_name || '',
    description: String(record.app_version_info == null ? annotations.version_info || '' : record.app_version_info),
    created_at: record.create_time || null,
    arch: manifest.arch || record.arch || '',
    manifest: { ...manifest, apps: apps.map((component, index) => ({ ...component,
      service_env_map_list: configs[index].service_env_map_list,
      extend_method_map: configs[index].extend_method_map })) },
    components: apps.map(component => ({ service_id: component.service_id, name: component.service_cname,
      service_alias: component.service_alias || '', source_type: component.service_source || component.source_type || '',
      source: component.git_url || component.image || component.delivered_path || component.share_image || '',
      branch: component.code_branch || component.branch || '',
      commit: component.commit || component.code_commit || (component.code_branch ? component.code_version : '') || '',
      vm: component.vm })),
    component_overrides: configs
  };
}

module.exports = { localTemplateVersion };
