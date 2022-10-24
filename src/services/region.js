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
  return request(`${apiconfig.baseUrl}/console/enterprise/helm/token`, {
    method: 'get',
    params: {
      eid
    }
  });
}
/* 通过helm生成命令安装集群 */
export async function fetchHelmCommand(param) {
  return request(`${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/helm/chart`, {
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
      appui: false,
      cloudserver: param.cloudserver ? param.cloudserver : ''
    }
  });
}
/* 通过helm生成命令对接控制台查看状态 */
export async function fetchHelmJoinStatus(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/helm/region_status`, {
    method: 'get',
    params: {
      eid: param.eid,
      token: param.token
    }
  });
}
/* 导入集群NameSpace */
export async function fetchImportMessage(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.eid}/regions/${param.region_id}/namespace`, {
    method: 'get',
    params: {
      content: 'unmanaged'
    }
  });
}
/* 获取NameSpace下的资源 */ 
export async function fetchNameSpaceResource(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.eid}/regions/${param.region_id}/resource`, {
    method: 'get',
    params: {
      content: 'unmanaged',
      namespace: param.namespace
    }
  });
}
/* 获取NameSpace下的高级资源 */ 
export async function fetchNameSpaceAdvancedResource(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.eid}/regions/${param.region_id}/convert-resource`, {
    method: 'get',
    params: {
      content: 'unmanaged',
      namespace: param.namespace
    }
  });
}
/*高级资源页面确认导入*/ 
export async function backNameSpaceAdvancedResource(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.eid}/regions/${param.region_id}/convert-resource`, {
    method: 'post',
    data: {
      content: 'unmanaged',
      namespace: param.namespace
    }
  });
}
// 获取某个集群的所有日志信息
export async function fetchClusterLogInfo(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/region_name/${param.region_name}/rbd-pods`, {
    method: 'get',
  });
}
// 获取某个集群的单个日志信息
export async function fetchClusterLogInfoSingle(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/region_name/${param.region_name}/rbd-component-logs`, {
    method: 'get',
    params: {
      lines: param.lines,
      rbd_name : param.rbd_name
    }
  });
}
// 获取某个集群的单个日志的节点信息
export async function fetchNodeInfo(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/region_name/${param.region_name}/rbd-logs`, {
    method: 'get',
    params: {
      pod_name : param.pod_name
    }
  });
}
// 获取控制台日志
export async function fetchConsoleLogs(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/goodrain_log`, {
    method: 'get',
  });
}
// 历史日志列表请求
export async function fetchHistoryLogs(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/region_name/${param.region_name}/rbd-log-files`, {
    method: 'get',
    params: {
      rbd_name : param.rbd_name
    }
  });
}
