/* eslint-disable no-undef */
import apiconfig from '../../config/api.config';
import request from '../utils/request';

/*
	获取集群下的协议
*/
export async function getProtocols(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/protocols`,
    {
      method: 'get',
      params: {
        region_name: body.region_name
      }
    }
  );
}

/** 创建集群 */
export async function createEnterpriseCluster(params, handleError = null) {
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
        provider: params.provider,
        provider_cluster_id: params.providerClusterID
      },
      handleError
    }
  );
}

/** 编辑集群 */
export async function upEnterpriseCluster(params) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/regions/${params.region_id}`,
    {
      method: 'PUT',
      data: params
    }
  );
}

/* 获取企业集群 */
export async function fetchEnterpriseClusters(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions`,
    {
      method: 'get',
      params: {
        check_status: param.check_status || 'yes'
      }
    }
  );
}

export async function fetchEnterpriseClusterTenants(param, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_id}/tenants`,
    {
      method: 'get',
      params: {
        page: param.page || 1,
        pageSize: param.pageSize || 10
      },
      handleError
    }
  );
}

export async function sethEnterpriseClusterTenantLimit(param, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_id}/tenants/${param.tenant_name}/limit`,
    {
      method: 'post',
      data: {
        limit_memory: param.limit_memory
      },
      handleError
    }
  );
}

/* 获取企业集群详情 */
export async function fetchEnterpriseCluster(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_id}`,
    {
      method: 'get'
    }
  );
}

/** 删除集群 */
export async function deleteEnterpriseCluster(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/regions/${params.region_id}`,
    {
      method: 'DELETE',
      data: {
        force: params.force
      },
      handleError
    }
  );
}
/* 获取HelmToken */
export async function fetchHelmToken({ eid }) {
  return request(`${apiconfig.baseUrl}/console/enterprise/helmtoken`, {
    method: 'get',
    params: {
      eid
    }
  });
}
/* 通过helm生成命令安装集群 */
export async function fetchHelmCommand(param) {
  return request(`${apiconfig.baseUrl}/enterprise-server/api/v1/helm/chart`, {
    method: 'post',
    data: {
      eid: param.eid,
      domain: param.domain,
      token: param.token,
      enableHA: param.data.enableHA,
      database: param.data.database,
      estorage: param.data.estorage,
      etcd: param.data.etcd,
      gatewayIngressIPs: param.data.gatewayIngressIPs,
      imageHub: param.data.imageHub,
      nodesForChaos: param.data.nodesForChaos,
      nodesForGateway: param.data.nodesForGateway,
      DockingType:param.data.type,
      appui: false
    }
  });
}
/* 通过helm生成命令对接控制台查看状态 */
export async function fetchHelmJoinStatus(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/helmStatus`, {
    method: 'get',
    params: {
      eid: param.eid,
      token: param.token
    }
  });
}
