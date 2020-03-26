import request from '../utils/request';
import apiconfig from '../../config/api.config';

/*
	获取集群下的协议
*/
export async function getProtocols(body = {
  team_name,
  region_name
}) {
  return request(`${apiconfig.baseUrl  }/console/teams/${body.team_name}/protocols`, {method: 'get',params: {
    region_name: body.region_name
  }});
}

/** 创建集群 */
export async function createEnterpriseCluster(params) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/regions`,
    {
      method: 'post',
      data: {
        region_alias: params.region_alias,
        region_name: params.region_name,
        region_type: params.region_type,
        desc: params.desc,
        token: params.token,
      },
    }
  );
}

/** 编辑集群 */
export async function upEnterpriseCluster(params) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/regions/${params.region_id}`,
    {
      method: 'PUT',
      data: params,
    }
  );
}

/* 获取企业集群 */
export async function fetchEnterpriseClusters(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions`,
    {
      method: 'get',
    }
  );
}

/* 获取企业集群详情 */
export async function fetchEnterpriseCluster(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_id}`,
    {
      method: 'get',
    }
  );
}

/** 删除集群 */
export async function deleteEnterpriseCluster(params) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/regions/${params.region_id}`,
    {
      method: 'DELETE',
    }
  );
}