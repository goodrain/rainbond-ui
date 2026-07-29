import apiconfig from '../../config/api.config';
import request from '../utils/request';

const AI_ENGINE_PLUGIN_BACKEND_PREFIX =
  '/console/regions/rainbond/backend/plugins/rainbond-ai-engine';

function buildTeamHeaders(body = {}) {
  const headers = {
    'X-AI-Team-Name': body.team_name,
    'X-AI-Region-Name': body.region_name,
  };

  if (body.namespace) {
    headers['X-AI-Team-Namespace'] = body.namespace;
  }

  return headers;
}

export async function getTeamLlmModels(body = {}) {
  return request(
    `${apiconfig.baseUrl}${AI_ENGINE_PLUGIN_BACKEND_PREFIX}/api/v1/ai-engine/team/models`,
    {
      method: 'get',
      headers: buildTeamHeaders(body),
    }
  );
}

export async function getTeamLlmCatalog(body = {}) {
  return request(
    `${apiconfig.baseUrl}${AI_ENGINE_PLUGIN_BACKEND_PREFIX}/api/v1/ai-engine/models`,
    {
      method: 'get',
      headers: buildTeamHeaders(body),
    }
  );
}

export async function createTeamLlmDownload(body = {}) {
  return request(
    `${apiconfig.baseUrl}${AI_ENGINE_PLUGIN_BACKEND_PREFIX}/api/v1/ai-engine/team/models/downloads`,
    {
      method: 'post',
      data: body.data || {},
      headers: buildTeamHeaders(body),
    }
  );
}

export async function uploadTeamLlmArtifact(body = {}) {
  return request(
    `${apiconfig.baseUrl}${AI_ENGINE_PLUGIN_BACKEND_PREFIX}/api/v1/ai-engine/team/uploads`,
    {
      method: 'post',
      data: body.formData,
      skipSlowRequestTelemetry: true,
      headers: buildTeamHeaders(body),
    }
  );
}
