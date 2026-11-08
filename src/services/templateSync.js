import apiconfig from '../../config/api.config';
import request from '../utils/request';
const { buildTemplatePayload } = require('../utils/templateDelivery');
const urlFor = scope => `${apiconfig.baseUrl}/console/teams/${encodeURIComponent(scope.teamName)}/groups/${encodeURIComponent(scope.appID)}/delivery-templates/sync`;

export async function startTemplateSync({ scope, values, configs, options, requestId }) {
  return request(urlFor(scope), { method: 'post', data: {
    ...buildTemplatePayload(values, configs, options), region_name: scope.regionName, request_id: requestId
  } });
}
export async function getTemplateSync({ scope, syncId }) {
  return request(`${urlFor(scope)}/${encodeURIComponent(syncId)}`, { method: 'get', params: { region_name: scope.regionName } });
}
export async function retryTemplateSync({ scope, syncId }) {
  return request(`${urlFor(scope)}/${encodeURIComponent(syncId)}/retry`, { method: 'post',
    params: { region_name: scope.regionName }, data: { region_name: scope.regionName } });
}
export async function cancelTemplateSync({ scope, syncId }) {
  return request(`${urlFor(scope)}/${encodeURIComponent(syncId)}`, { method: 'delete', params: { region_name: scope.regionName } });
}
export async function loadTemplateSyncLogs({ scope, syncId, serviceId }) {
  return request(`${urlFor(scope)}/${encodeURIComponent(syncId)}/components/${encodeURIComponent(serviceId)}/logs`, {
    method: 'get', params: { region_name: scope.regionName }
  });
}
