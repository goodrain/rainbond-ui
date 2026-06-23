import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getPlatformSettings(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/platform-settings`,
    { method: 'get' }
  );
}

export async function updatePlatformSettings(body = {}) {
  const data = {};
  if (Object.prototype.hasOwnProperty.call(body, 'enable_team_resource_view')) {
    data.enable_team_resource_view = body.enable_team_resource_view;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'enable_global_image_registry')) {
    data.enable_global_image_registry = body.enable_global_image_registry;
  }
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/platform-settings/update`,
    {
      method: 'put',
      data
    }
  );
}
