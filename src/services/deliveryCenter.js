import apiconfig from '../../config/api.config';
import request from '../utils/request';
import { getAppVersionList } from './app';
import { loadDeliverySource } from './templateDelivery';
const { assetSource, buildRecord } = require('../utils/deliveryAsset');
const { listingGroups } = require('../utils/deliveryWorkflow');
const url = enterprise => `${apiconfig.baseUrl}/console/enterprises/${encodeURIComponent(enterprise)}/development-deliveries`;
const base = scope => `${apiconfig.baseUrl}/console/teams/${encodeURIComponent(scope.teamName)}/groups/${encodeURIComponent(scope.appID)}/delivery-templates`;
const commentText = value => typeof value === 'string' ? value.replace(/<\/?[a-z][^>]*>/gi, '')
  .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, entity => ({ '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[entity])).trim() : '';
async function componentEvents(scope, component, page) {
  if (!component || !component.service_alias) throw new Error('workflow.componentEventsUnavailable');
  const pageSize = 20;
  const response = await request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(scope.teamName)}/events`, {
    method: 'get', params: { region_name: scope.regionName, target: 'service', targetAlias: component.service_alias, page, page_size: pageSize },
    showMessage: false, timeout: 12000
  });
  if (!response || !Array.isArray(response.list)) throw new Error('workflow.componentEventsUnavailable');
  const total = response.total != null && Number.isFinite(Number(response.total)) ? Number(response.total) : undefined;
  const items = response.list.filter(event => (!event.service_id || String(event.service_id) === String(component.service_id)) &&
    (event.target !== 'service' || !event.target_id || String(event.target_id) === String(component.service_id)))
    .map(event => ({ ...event, service_id: String(component.service_id), id: `component:${component.service_id}:${event.event_id || event.ID || event.start_time}`,
      component_name: component.name, comment_text: commentText(event.message || event.type_cn || event.type || event.opt_type),
      created_at: event.start_time || event.created_at, user_name: event.user_name || event.username }));
  const hasMore = typeof response.has_next === 'boolean' ? response.has_next : total == null ? response.list.length === pageSize : page * pageSize < total;
  return { bean: { items, page, total, has_more: hasMore } };
}

async function sourceComponents(scope) {
  const components = [], seen = new Set();
  const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? undefined : Number(value);
  for (let page = 1; ; page += 1) {
    const response = await request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(scope.teamName)}/service/group`, {
      method: 'get', params: { region_name: scope.regionName, group_id: scope.appID, page, page_size: 100 }, showMessage: false
    });
    if (!response || !Array.isArray(response.list)) throw new Error('workflow.unavailable');
    const fresh = response.list.filter(item => item.service_id && !seen.has(String(item.service_id)));
    fresh.forEach(item => {
      seen.add(String(item.service_id));
      components.push({ service_id: String(item.service_id), name: item.service_cname || item.service_name || item.service_alias, service_alias: item.service_alias || '',
        status: item.status || item.service_status || '', source_type: item.service_source || item.source_type, vm: !!item.vm,
        source: String(item.git_url || item.image || item.image_name || '').replace(/(https?:\/\/)[^/@]+@/, '$1').split(/[?#]/)[0],
        branch: item.code_version || item.branch || '', commit: item.commit || item.commit_sha || item.code_commit || '',
        cpu_millicores: number(item.container_cpu != null ? item.container_cpu : item.min_cpu),
        memory_mib: number(item.container_memory != null ? item.container_memory : item.min_memory), replicas: number(item.current_node != null ? item.current_node : item.min_node),
        updated_at: item.update_time || item.updated_at || null });
    });
    if (fresh.length < 100) return { bean: { components } };
  }
}


export async function loadDeliveryCenter({ user, kind, groupId, scope, component, components, page = 1 }) {
  if (kind === 'source') {
    const response = await loadDeliverySource(scope, { showMessage: false });
    if (!response || !response.bean || !Array.isArray(response.bean.apps)) throw new Error('workflow.sourceUnavailable');
    return { bean: { components: response.bean.apps.map(assetSource), collected_at: new Date().toISOString() } };
  }
  if (kind === 'buildHistory') {
    const response = await getAppVersionList({ team_name: scope.teamName, service_alias: component.service_alias,
      region_name: scope.regionName, page_num: page, page_size: 5, showMessage: false });
    if (!response || !Array.isArray(response.list)) throw new Error('workflow.historyUnavailable');
    return { bean: { records: response.list.map(buildRecord), total: response.total == null ? response.list.length : Number(response.total),
      currentVersion: response.bean && response.bean.current_version, page } };
  }
  if (kind === 'componentEvents') return componentEvents(scope, component, page);
  if (kind === 'access') {
    const aliases = (components || []).map(item => item.service_alias).filter(Boolean);
    if (!aliases.length) return { bean: { list: [] } };
    const response = await request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(scope.teamName)}/group/service/visit`, {
      method: 'get', params: { service_alias: aliases.join('-'), region_name: scope.regionName }, showMessage: false, timeout: 12000
    });
    if (!response || !Array.isArray(response.list)) throw new Error('workflow.unavailable');
    return { bean: { list: response.list } };
  }
  if (kind === 'targets') return request(`${apiconfig.baseUrl}/console/delivery-targets`, { method: 'get' });
  if (kind === 'runtime') {
    const source = scope;
    const results = await Promise.allSettled([
      request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(source.teamName)}/groups/${encodeURIComponent(source.appID)}`, { method: 'get', params: { region_name: source.regionName }, showMessage: false }),
      request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(source.teamName)}/group/${encodeURIComponent(source.appID)}/resources`, { method: 'get', params: { region_name: source.regionName }, showMessage: false }),
      request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(source.teamName)}/groups/${encodeURIComponent(source.appID)}/status`, { method: 'get', params: { region_name: source.regionName }, showMessage: false }),
      sourceComponents(source)
    ]);
    const values = results.map(result => result.status === 'fulfilled' && result.value ? result.value : null);
    const components = values[3] && values[3].bean ? values[3].bean.components : null;
    const app = values[0] && values[0].bean;
    const resourceBean = values[1] && values[1].bean;
    const resources = resourceBean && Object.keys(resourceBean).length ? resourceBean : values[1] && values[1].list;
    const state = values[2] && (values[2].list && Object.keys(values[2].list).length ? values[2].list : values[2].bean);
    return { bean: { app: app && Object.keys(app).length ? app : null, resources: resources && Object.keys(resources).length ? resources : null,
      state: state && Object.keys(state).length ? state : null, components,
      collected_at: new Date().toISOString() } };

  }
  if (kind === 'center') {
    const response = await request(url(user.enterprise_id), { method: 'get', params: { group_id: groupId } });
    if (!response || !response.bean) return response;
    return { ...response, bean: { ...response.bean, groups: listingGroups(response.bean.listings) } };
  }
  return request(`${base(scope)}/records`, { method: 'get', params: { region_name: scope.regionName } });
}
export async function actOnDelivery({ operation, user, scope, template, reason, requestId, decision, comment, target, kind, listingId, destination, environment, requestKey, format, image_handle, action: withdrawalAction }) {
  const listing = requestId || listingId;
  if (operation === 'withdraw') return request(`${base(scope)}/versions/${encodeURIComponent(template.id)}/listing-requests/${encodeURIComponent(listing)}/withdraw`, {
    method: 'post', data: { region_name: scope.regionName, action: withdrawalAction }
  });
  if (operation === 'review') return request(`${apiconfig.baseUrl}/console/enterprises/${encodeURIComponent(user.enterprise_id)}/listing-requests/${encodeURIComponent(listing)}/review`, {
    method: 'post', data: { decision, comment }
  });
  if (kind === 'test') return request(`${apiconfig.baseUrl}/console/enterprises/${encodeURIComponent(user.enterprise_id)}/listing-requests/${encodeURIComponent(listing)}/test-deployments`, {
    method: 'post', data: { target, environment, request_id: requestKey }
  });
  const action = operation === 'listing' ? 'listing-requests' : kind === 'offline' ? 'exports' : 'installations';
  return request(`${base(scope)}/versions/${encodeURIComponent(template.id)}/${action}`, {
    method: 'post', data: { region_name: scope.regionName, reason, destination, target, environment, format, image_handle, request_id: requestKey }
  });
}

export async function retryDeliveryTask(taskId) {
  return request(`${apiconfig.baseUrl}/console/delivery-tasks/${encodeURIComponent(taskId)}/retry`, { method: 'post' });
}

export async function loadDeliveryUpgrade(taskId) {
  return request(`${apiconfig.baseUrl}/console/delivery-tasks/${encodeURIComponent(taskId)}/upgrade`, {
    method: 'get', showMessage: false, timeout: 15000
  });
}
