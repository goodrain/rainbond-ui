import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function inspectDeviceAuthorization(data) {
  return request(`${apiconfig.baseUrl}/console/mcp/device/inspect`, {
    method: 'post',
    data,
    showMessage: false,
    showLoading: false,
    noModels: true
  });
}

export async function decideDeviceAuthorization(data) {
  return request(`${apiconfig.baseUrl}/console/mcp/device/authorize`, {
    method: 'post',
    data,
    showMessage: false,
    showLoading: false,
    noModels: true
  });
}
