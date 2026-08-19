import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getRainskillsAccess() {
  return request(`${apiconfig.baseUrl}/console/rainskills/access`, {
    method: 'get',
    showMessage: false
  });
}
