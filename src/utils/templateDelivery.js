const { isNodeScalingDisabled } = require('../pages/Group/components/appShareFormHelpers');
const sensitiveName = name => /password|passwd|token|secret|private.?key|api.?key|access.?key|credential|authorization/i.test(name || '');
const clone = value => JSON.parse(JSON.stringify(value));

function normalizeTemplateConfig(component, envs = [], scaling = {}) {
  const method = scaling.extend_method || component.extend_method || component.service_type || '';
  const source = component.extend_method_map || {};
  return {
    service_id: String(component.service_id), extend_method: component.vm ? 'vm' : method,
    service_env_map_list: envs.map((item, index) => ({ ...item, _key: `env-${index}`,
      is_sensitive: !!(item.is_sensitive || item.is_secret || sensitiveName(item.attr_name)),
      attr_value: item.is_sensitive || item.is_secret || sensitiveName(item.attr_name) ? '' : String(item.attr_value == null ? '' : item.attr_value) })),
    extend_method_map: {
      min_node: source.min_node != null ? source.min_node : scaling.current_node != null ? scaling.current_node : 1,
      max_node: source.max_node != null ? source.max_node : method === 'singleton' ? 1 : 64,
      step_node: source.step_node != null ? source.step_node : 1,
      init_memory: source.init_memory != null ? source.init_memory : scaling.current_memory != null ? scaling.current_memory : 128,
      container_cpu: source.container_cpu != null ? source.container_cpu : scaling.current_cpu != null ? scaling.current_cpu : 100
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
    if (!Number.isSafeInteger(values[key]) || values[key] < (['init_memory', 'container_cpu'].includes(key) ? 0 : 1)) errors[key] = 'numberInvalid';
  });
  if (!isNodeScalingDisabled(config) && values.max_node < values.min_node) errors.max_node = 'rangeInvalid';
  return errors;
}

function validateTemplateInfo(values, pluginEnabled, plugin = {}) {
  const errors = {};
  if (!String(values.template_name || '').trim() || values.template_name.trim().length > 64) errors.template_name = 'nameRequired';
  if (!/^[0-9]+(\.[0-9]+){1,2}$/.test(String(values.version || '').trim())) errors.version = 'versionInvalid';
  if (String(values.description || '').length > 255) errors.description = 'descriptionLimit';
  if (!Array.isArray(values.service_ids) || !values.service_ids.length) errors.service_ids = 'componentsRequired';
  if (pluginEnabled) {
    ['plugin_id', 'plugin_name', 'plugin_type', 'entry_path'].forEach(key => {
      if (!String(plugin[key] || '').trim()) errors[key] = 'pluginRequired';
    });
    if (!Array.isArray(plugin.inject_position) || !plugin.inject_position.length) errors.inject_position = 'pluginRequired';
  }
  return errors;
}

function buildTemplatePayload(values, configs, options = {}) {
  if (Object.keys(validateTemplateInfo(values, options.pluginEnabled, options.plugin)).length) throw new Error('delivery.invalidForm');
  const ids = Array.from(new Set(values.service_ids));
  const overrides = ids.map(id => {
    const config = configs[id];
    if (!config || Object.keys(validateTemplateConfig(config)).length) throw new Error('delivery.configIncomplete');
    const scaling = { ...config.extend_method_map };
    if (isNodeScalingDisabled(config)) ['min_node', 'max_node', 'step_node'].forEach(key => delete scaling[key]);
    const envs = config.service_env_map_list.map(item => ({
      attr_name: item.attr_name, attr_value: item.is_sensitive || sensitiveName(item.attr_name) ? '' : item.attr_value,
      ...(item.is_sensitive || sensitiveName(item.attr_name) ? { required_on_install: true, is_sensitive: true } : {})
    }));
    return { service_id: id, extend_method: config.extend_method, service_env_map_list: envs,
      ...(config.extend_method !== 'vm' ? { extend_method_map: scaling } : {}) };
  });
  if (!['local', 'market', 'offline'].includes(options.destination) || options.destination === 'market' && !options.market_id) {
    throw new Error('delivery.destinationRequired');
  }
  const plugin = options.plugin || {};
  return {
    template_name: values.template_name.trim(), version: values.version.trim(), description: String(values.description || '').trim(),
    service_ids: ids, component_overrides: overrides, destination: options.destination,
    ...(options.destination === 'market' ? { market_id: options.market_id, market_name: options.market_name } : {}),
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

module.exports = { sensitiveName, normalizeTemplateConfig, validateTemplateConfig, validateTemplateInfo, buildTemplatePayload,
  deliveryScope, appendTemplateRecord };
