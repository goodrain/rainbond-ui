import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getAgentAccess() {
  return request(`${apiconfig.baseUrl}/console/agent/access`, {
    method: 'get',
    showMessage: false
  });
}
