const { isNodeScalingDisabled } = require('../pages/Group/components/appShareFormHelpers');
const sensitiveName = name => /password|passwd|token|secret|private.?key|api.?key|access.?key|credential|authorization/i.test(name || '');
const clone = value => JSON.parse(JSON.stringify(value));

function normalizeTemplateConfig(component, envs = [], scaling = {}) {
  const method = scaling.extend_method || component.extend_method || component.service_type || '';
  const source = component.extend_method_map || {};
  const value = (field, current) => source[field] != null ? source[field] : scaling[field] != null ? scaling[field] : current ? scaling[current] : undefined;
  return {
    service_id: String(component.service_id), extend_method: component.vm ? 'vm' : method,
    service_env_map_list: envs.map((item, index) => ({ ...item, _key: `env-${index}`,
      is_sensitive: !!(item.is_sensitive || item.is_secret || sensitiveName(item.attr_name)),
      attr_value: item.is_sensitive || item.is_secret || sensitiveName(item.attr_name) ? '' : String(item.attr_value == null ? '' : item.attr_value) })),
    extend_method_map: {
      min_node: value('min_node', 'current_node'),
      max_node: value('max_node'),
      step_node: value('step_node'),
      init_memory: value('init_memory', 'current_memory'),
      container_cpu: value('container_cpu', 'current_cpu')
    }
  };
}

function validateTemplateConfig(config) {
  const errors = {}, names = new Set();
  (config.service_env_map_list || []).forEach(item => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(item.attr_name) || names.has(item.attr_name)) errors.environment = 'environmentInvalid';
    names.add(item.attr_name);
  });
  if (config.extend_method === 'vm') return errors;
  const values = config.extend_method_map || {};
  const fields = isNodeScalingDisabled(config) ? ['init_memory', 'container_cpu'] :
    ['min_node', 'max_node', 'step_node', 'init_memory', 'container_cpu'];
  fields.forEach(key => {
    if (values[key] == null || values[key] === '') return;
    if (!Number.isSafeInteger(values[key]) || values[key] < (['init_memory', 'container_cpu'].includes(key) ? 0 : 1)) errors[key] = 'numberInvalid';
  });
  if (!isNodeScalingDisabled(config) && values.max_node != null && values.max_node !== '' &&
    values.min_node != null && values.min_node !== '' && values.max_node < values.min_node) errors.max_node = 'rangeInvalid';
  return errors;
}

function validateVersionInfo(values, pluginEnabled, plugin = {}) {
  const errors = {};
  if (!/^[0-9]+(\.[0-9]+){1,2}$/.test(String(values.version || '').trim())) errors.version = 'versionInvalid';
  if (String(values.description || '').length > 20000) errors.description = 'descriptionLimit';
  if (!Array.isArray(values.service_ids) || !values.service_ids.length) errors.service_ids = 'componentsRequired';
  if (pluginEnabled) {
    ['plugin_id', 'plugin_name', 'plugin_type', 'entry_path'].forEach(key => {
      if (!String(plugin[key] || '').trim()) errors[key] = 'pluginRequired';
    });
    if (!Array.isArray(plugin.inject_position) || !plugin.inject_position.length) errors.inject_position = 'pluginRequired';
  }
  return errors;
}

function validateTemplateInfo(values, pluginEnabled, plugin = {}) {
  const errors = validateVersionInfo(values, pluginEnabled, plugin);
  if (!String(values.template_name || '').trim() || values.template_name.trim().length > 64) errors.template_name = 'nameRequired';
  if (String(values.template_description || '').length > 400) errors.template_description = 'templateDescriptionLimit';
  return errors;
}

function buildTemplatePayload(values, configs, options = {}) {
  if (Object.keys((options.versionOnly ? validateVersionInfo : validateTemplateInfo)(values, options.pluginEnabled, options.plugin)).length) throw new Error('delivery.invalidForm');
  const ids = Array.from(new Set(values.service_ids));
  const overrides = ids.map(id => {
    const config = configs[id];
    if (!config || Object.keys(validateTemplateConfig(config)).length) throw new Error('delivery.configIncomplete');
    const scaling = Object.keys(config.extend_method_map || {}).reduce((result, key) => {
      const value = config.extend_method_map[key];
      if (value != null && value !== '') result[key] = value;
      return result;
    }, {});
    if (isNodeScalingDisabled(config)) ['min_node', 'max_node', 'step_node'].forEach(key => delete scaling[key]);
    const envs = config.service_env_map_list.map(item => ({
      attr_name: item.attr_name, attr_value: item.is_sensitive || sensitiveName(item.attr_name) ? '' : item.attr_value,
      ...(item.is_sensitive || sensitiveName(item.attr_name) ? { is_sensitive: true } : {})
    }));
    return { service_id: id, extend_method: config.extend_method, service_env_map_list: envs,
      ...(config.extend_method !== 'vm' ? { extend_method_map: scaling } : {}) };
  });
  const plugin = options.plugin || {};
  return {
    ...(!options.versionOnly ? { template_name: values.template_name.trim(), logo: String(values.logo || ''),
      template_description: String(values.template_description || '').trim() } : {}),
    version: values.version.trim(), description: String(values.description || '').trim(),
    service_ids: ids, component_overrides: overrides,
    is_platform_plugin: !!options.pluginEnabled,
    ...(options.pluginEnabled ? { plugin: {
      plugin_id: plugin.plugin_id.trim(), plugin_name: plugin.plugin_name.trim(), plugin_type: plugin.plugin_type,
      frontend_component: plugin.frontend_component || '', entry_path: plugin.entry_path.trim(),
      inject_position: plugin.inject_position.includes('NoInject') ? [] : plugin.inject_position.slice(),
      menu_title: plugin.menu_title || '', route_path: plugin.route_path ? `/plugins/${plugin.route_path.replace(/^\/+/, '').replace(/^plugins\//, '')}` : ''
    } } : {})
  };
}

function deliveryScope(scope) {
  const values = [scope.enterprise_id, scope.teamName, scope.regionName, scope.appID];
  if (values.some(value => value == null || String(value) === '')) throw new Error('delivery.unavailable');
  return values.map(value => encodeURIComponent(String(value))).join(':');
}

function appendTemplateRecord(records, scope, payload, components, user, now, id) {
  const key = deliveryScope(scope);
  if (records.some(row => row.scope === key && row.template_name === payload.template_name && row.version === payload.version)) {
    throw new Error('delivery.versionExists');
  }
  const selected = payload.service_ids.map(serviceId => components.find(item => item.service_id === serviceId));
  if (selected.some(item => !item)) throw new Error('delivery.componentsChanged');
  const row = {
    ...clone(payload), id, scope: key, created_at: now, creator_name: user.nick_name || user.user_name || String(user.user_id),
    status: payload.destination === 'offline' ? 'packaging' : 'published',
    components: selected.map(item => ({ service_id: item.service_id, name: item.name, service_alias: item.service_alias,
      source_type: item.source_type, source: item.source, branch: item.branch, commit: item.commit, vm: item.vm }))
  };
  return { row, records: [row, ...records] };
}

module.exports = { sensitiveName, normalizeTemplateConfig, validateTemplateConfig, validateTemplateInfo, validateVersionInfo, buildTemplatePayload,
  deliveryScope, appendTemplateRecord };
