import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getVMTemplates(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/vm/templates`,
    {
      method: 'get'
    }
  );
}

export async function getVMTemplateDetail(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/vm/templates/${body.template_id}`,
    {
      method: 'get'
    }
  );
}

export async function updateVMTemplate(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/vm/templates/${body.template_id}`,
    {
      method: 'put',
      data: {
        disabled: !!body.disabled
      }
    }
  );
}

export async function retryVMTemplateVersion(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/vm/templates/${body.template_id}/versions/${body.version_id}/retry`,
    {
      method: 'post'
    }
  );
}
