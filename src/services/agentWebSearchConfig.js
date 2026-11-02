import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getAgentWebSearchConfig(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/agent-web-search-config`,
    { method: 'get', showMessage: false }
  );
}

export async function updateAgentWebSearchConfig(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/agent-web-search-config`,
    {
      method: 'put',
      data: {
        enabled: body.enabled,
        provider: body.provider,
        api_key: body.api_key,
        max_results: body.max_results,
        fetch_timeout_ms: body.fetch_timeout_ms
      }
    }
  );
}

export async function clearAgentWebSearchConfig(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/agent-web-search-config`,
    { method: 'delete' }
  );
}
