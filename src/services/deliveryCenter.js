import apiconfig from '../../config/api.config';
import request from '../utils/request';
const { listingGroups } = require('../utils/deliveryWorkflow');
const url = enterprise => `${apiconfig.baseUrl}/console/enterprises/${encodeURIComponent(enterprise)}/development-deliveries`;
const base = scope => `${apiconfig.baseUrl}/console/teams/${encodeURIComponent(scope.teamName)}/groups/${encodeURIComponent(scope.appID)}/delivery-templates`;
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
      components.push({ service_id: String(item.service_id), name: item.service_cname || item.service_name || item.service_alias,
        status: item.status || item.service_status || '', source_type: item.service_source || item.source_type, vm: !!item.vm,
        source: String(item.git_url || item.image || item.image_name || '').replace(/(https?:\/\/)[^/@]+@/, '$1').split(/[?#]/)[0],
        branch: item.code_version || item.branch || '', commit: item.commit || item.commit_sha || item.code_commit || '',
        cpu_millicores: number(item.container_cpu != null ? item.container_cpu : item.min_cpu),
        memory_mib: number(item.container_memory != null ? item.container_memory : item.min_memory), replicas: number(item.current_node != null ? item.current_node : item.min_node) });
    });
    if (fresh.length < 100) return { bean: { components } };
  }
}


export async function loadDeliveryCenter({ user, kind, groupId, scope }) {
  if (kind === 'targets') return request(`${apiconfig.baseUrl}/console/delivery-targets`, { method: 'get' });
  if (kind === 'runtime') {
    const source = scope;
    const results = await Promise.allSettled([
      request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(source.teamName)}/groups/${encodeURIComponent(source.appID)}`, { method: 'get', params: { region_name: source.regionName }, showMessage: false }),
      request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(source.teamName)}/group/${encodeURIComponent(source.appID)}/resources`, { method: 'get', params: { region_name: source.regionName }, showMessage: false }),
      request(`${apiconfig.baseUrl}/console/enterprise/${encodeURIComponent(user.enterprise_id)}/operation-logs`, { method: 'get', params: { page: 1, page_size: 20, query: source.appID }, showMessage: false }),
      request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(source.teamName)}/groups/${encodeURIComponent(source.appID)}/status`, { method: 'get', params: { region_name: source.regionName }, showMessage: false }),
      sourceComponents(source)
    ]);
    const values = results.map(result => result.status === 'fulfilled' && result.value ? result.value : null);
    const events = values[2] && (Array.isArray(values[2].list) && values[2].list.length ? values[2].list : values[2].bean && values[2].bean.list || values[2].list) || [];
    const app = values[0] && values[0].bean;
    const resourceBean = values[1] && values[1].bean;
    const resources = resourceBean && Object.keys(resourceBean).length ? resourceBean : values[1] && values[1].list;
    const state = values[3] && (values[3].list && Object.keys(values[3].list).length ? values[3].list : values[3].bean);
    return { bean: { app: app && Object.keys(app).length ? app : null, resources: resources && Object.keys(resources).length ? resources : null,
      state: state && Object.keys(state).length ? state : null, components: values[4] && values[4].bean ? values[4].bean.components : null,
      events_available: !!values[2], events: Array.isArray(events) ? events.filter(event => String(event.group_id || event.app_id || event.application_id) === String(source.appID) &&
        (!event.team_name || event.team_name === source.teamName) && (!event.region_name || event.region_name === source.regionName)) : [], collected_at: new Date().toISOString() } };

  }
  if (kind === 'center') {
    const response = await request(url(user.enterprise_id), { method: 'get', params: { group_id: groupId } });
    if (!response || !response.bean) return response;
    return { ...response, bean: { ...response.bean, groups: listingGroups(response.bean.listings) } };
  }
  return request(`${base(scope)}/records`, { method: 'get', params: { region_name: scope.regionName } });
}
export async function actOnDelivery({ operation, user, scope, template, reason, requestId, decision, comment, target, kind, listingId, destination, environment, requestKey }) {
  const listing = requestId || listingId;
  if (operation === 'review') return request(`${apiconfig.baseUrl}/console/enterprises/${encodeURIComponent(user.enterprise_id)}/listing-requests/${encodeURIComponent(listing)}/review`, {
    method: 'post', data: { decision, comment }
  });
  if (kind === 'test') return request(`${apiconfig.baseUrl}/console/enterprises/${encodeURIComponent(user.enterprise_id)}/listing-requests/${encodeURIComponent(listing)}/test-deployments`, {
    method: 'post', data: { target, environment, request_id: requestKey }
  });
  const action = operation === 'listing' ? 'listing-requests' : kind === 'offline' ? 'exports' : 'installations';
  return request(`${base(scope)}/versions/${encodeURIComponent(template.id)}/${action}`, {
    method: 'post', data: { region_name: scope.regionName, reason, destination, target, environment, request_id: requestKey }
  });
}

export async function retryDeliveryTask(taskId) {
  return request(`${apiconfig.baseUrl}/console/delivery-tasks/${encodeURIComponent(taskId)}/retry`, { method: 'post' });
}
