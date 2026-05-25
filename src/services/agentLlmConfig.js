import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getAgentLlmConfig(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/agent-llm-config`,
    {
      method: 'get',
      showMessage: false
    }
  );
}

export async function updateAgentLlmConfig(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/agent-llm-config`,
    {
      method: 'put',
      data: {
        openai_api_key: body.openai_api_key,
        openai_model: body.openai_model,
        openai_base_url: body.openai_base_url,
        llm_thinking_enabled: body.llm_thinking_enabled,
        llm_reasoning_effort: body.llm_reasoning_effort
      }
    }
  );
}

export async function clearAgentLlmConfig(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/agent-llm-config`,
    {
      method: 'delete'
    }
  );
}
