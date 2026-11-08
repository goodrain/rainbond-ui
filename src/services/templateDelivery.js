import apiconfig from '../../config/api.config';
import request from '../utils/request';
import { getStoreList } from './market';
const { normalizeTemplateConfig } = require('../utils/templateDelivery');
const urlFor = scope => `${apiconfig.baseUrl}/console/teams/${encodeURIComponent(scope.teamName)}/groups/${encodeURIComponent(scope.appID)}/delivery-templates`;

export async function listDeliveryTemplates(scope) {
  return request(urlFor(scope), { method: 'get', params: { region_name: scope.regionName } });
}
export async function loadDeliverySource(scope) {
  return request(`${urlFor(scope)}/source`, { method: 'get', params: { region_name: scope.regionName } });
}
export async function loadDeliveryComponents(scope) {
  const response = await loadDeliverySource(scope);
  if (!response || !response.bean || !Array.isArray(response.bean.apps)) throw new Error('delivery.componentsUnavailable');
  return { bean: { components: response.bean.apps.map(item => ({
    service_id: item.service_id, service_alias: item.service_alias, name: item.service_cname,
    source_type: item.service_source, source: item.git_url || item.image || '',
    branch: item.code_branch || '', commit: item.code_version || '', extend_method: item.extend_method,
    extend_method_map: item.extend_method_map, vm: item.vm, delivery_available: item.delivery_available,
    configuration: { ...item, service_env_map_list: item.service_env_map_list || [] }
  })) } };
}
export async function loadDeliveryConfig({ component }) {
  const config = component.configuration;
  if (!config) throw new Error('delivery.configUnavailable');
  return { bean: normalizeTemplateConfig(component, config.service_env_map_list, config.extend_method_map) };
}
export async function loadDeliveryMarkets(scope) {
  const response = await getStoreList({ enterprise_id: scope.enterprise_id });
  if (!response || !Array.isArray(response.list)) throw new Error('delivery.marketsUnavailable');
  return { bean: { items: response.list.map(item => ({ id: item.store_id || item.name,
    name: item.name || item.store_name })).filter(item => item.id) } };
}
export async function loadTemplateChanges({ scope }) {
  return request(`${urlFor(scope)}/changes`, { method: 'get', params: { region_name: scope.regionName } });
}
export async function deleteDeliveryVersion({ scope, templateId }) {
  return request(`${urlFor(scope)}/versions/${encodeURIComponent(templateId)}`, { method: 'delete', params: { region_name: scope.regionName } });
}
export async function publishDeliveryTemplate({ scope, options }) {
  return request(urlFor(scope), { method: 'post', data: { sync_id: options.sync_id, region_name: scope.regionName } });
}
