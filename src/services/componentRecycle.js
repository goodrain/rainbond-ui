import apiconfig from '../../config/api.config';
import request from '../utils/request';

export function recycleRequest(body, operation = 'list', handleError, shouldApply) {
  if (shouldApply && !shouldApply()) return undefined;
  for (const key of ['team_name', 'region_name']) {
    if (typeof body[key] !== 'string' || !body[key] || ['.', '..'].includes(body[key])) throw new Error('Invalid recycle scope');
  }
  if (!['list', 'restore', 'purge'].includes(operation)) throw new Error('Invalid recycle operation');
  let url = `${apiconfig.baseUrl}/console/teams/${encodeURIComponent(body.team_name)}/recycle-bin`;
  if (operation !== 'list') {
    if (!/^[a-zA-Z0-9-]{1,63}$/.test(body.service_id || '')) throw new Error('Invalid recycle component');
    url += `/${body.service_id}${operation === 'restore' ? '/restore' : ''}`;
  }
  return request(url, {
    method: operation === 'list' ? 'get' : operation === 'restore' ? 'post' : 'delete',
    params: { region_name: body.region_name, ...(operation === 'list' ? { page: body.page || 1 } : {}) },
    data: { team_name: body.team_name, region_name: body.region_name },
    shouldApply, showLoading: false, showMessage: false,
    handleError: error => { if ((!shouldApply || shouldApply()) && handleError) handleError(error); }
  });
}
