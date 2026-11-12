import apiconfig from '../../config/api.config';
import request from '../utils/request';
import { getStoreList } from './market';
const { normalizeTemplateConfig, buildTemplatePayload } = require('../utils/templateDelivery');
const { deliveryMarketOptions } = require('../utils/deliveryMarkets');
const urlFor = scope => `${apiconfig.baseUrl}/console/teams/${encodeURIComponent(scope.teamName)}/groups/${encodeURIComponent(scope.appID)}/delivery-templates`;

export async function listDeliveryTemplates(scope) {
  return request(urlFor(scope), { method: 'get', params: { region_name: scope.regionName } });
}
export async function loadDeliverySource(scope, options = {}) {
  return request(`${urlFor(scope)}/source`, { method: 'get', params: { region_name: scope.regionName,
    ...(scope.snapshotId !== undefined ? { snapshot_id: scope.snapshotId } : {}) },
    ...(options.showMessage === false ? { showMessage: false } : {}) });
}
export async function loadDeliveryComponents(scope) {
  const [response, saved] = await Promise.all([loadDeliverySource(scope), listDeliveryTemplates(scope)]);
  if (!response || !response.bean || !Array.isArray(response.bean.apps)) throw new Error('delivery.componentsUnavailable');
  if (scope.snapshotId !== undefined && (!response.bean.source_snapshot ||
    String(response.bean.source_snapshot.version_id) !== String(scope.snapshotId))) throw new Error('delivery.componentsUnavailable');
  const records = saved && saved.bean && saved.bean.items || [];
  const version = records.find(item => item.template_id);
  const annotations = version && version.manifest && version.manifest.annotations || {};
  const metadata = saved && saved.bean && saved.bean.template || version && {
    id: version.template_id, name: version.template_name || version.manifest && version.manifest.group_name || '',
    logo: version.logo == null ? annotations.logo || '' : version.logo,
    description: version.template_description == null ? annotations.describe || '' : version.template_description
  };
  const latest = records.filter(item => !item.deleted_at).slice().sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0))[0];
  return { bean: { template: metadata || null, sourceSnapshot: response.bean.source_snapshot || null,
    application: response.bean.application || {}, latestVersion: latest ? latest.version : null, components: response.bean.apps.map(item => ({
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
  return { bean: { items: deliveryMarketOptions(response.list) } };
}
export async function loadTemplateChanges({ scope }) {
  return request(`${urlFor(scope)}/changes`, { method: 'get', params: { region_name: scope.regionName } });
}
export async function deleteDeliveryVersion({ scope, templateId }) {
  return request(`${urlFor(scope)}/versions/${encodeURIComponent(templateId)}`, { method: 'delete', params: { region_name: scope.regionName } });
}
export async function publishDeliveryTemplate({ scope, values, configs, options, requestId }) {
  return request(urlFor(scope), { method: 'post', data: {
    ...buildTemplatePayload(values, configs, { ...options, versionOnly: true }), request_id: requestId, region_name: scope.regionName,
    ...(scope.snapshotId !== undefined ? { snapshot_id: scope.snapshotId } : {})
  } });
}
export async function loadDeliveryExports({ scope, versionId }) {
  return request(`${urlFor(scope)}/versions/${encodeURIComponent(versionId)}/exports`, {
    method: 'get', params: { region_name: scope.regionName }
  });
}
