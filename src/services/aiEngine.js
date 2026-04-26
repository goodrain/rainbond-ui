import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getTeamLlmModels(body = {}) {
  const headers = {
    'X-AI-Team-Name': body.team_name,
    'X-AI-Region-Name': body.region_name,
  };

  if (body.namespace) {
    headers['X-AI-Team-Namespace'] = body.namespace;
  }

  return request(`${apiconfig.baseUrl}/api/v1/ai-engine/team/models`, {
    method: 'get',
    headers,
  });
}
