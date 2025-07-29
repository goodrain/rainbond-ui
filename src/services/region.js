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
export async function fetchEnterpriseClusters(param, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions`,
    {
      method: 'get',
      params: {
        check_status: param.check_status || 'yes'
      },
      handleError
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
        limit_memory: param.limit_memory,
        limit_cpu: param.limit_cpu,
        limit_storage: param.limit_storage
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
      DockingType: param.data.type,
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
      token: param.token,
      api_host: param.api_host
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
      rbd_name: param.rbd_name
    }
  });
}
// 获取某个集群的单个日志的节点信息
export async function fetchNodeInfo(param) {
  return request(`${apiconfig.baseUrl}/console/enterprise/region_name/${param.region_name}/rbd-logs`, {
    method: 'get',
    params: {
      pod_name: param.pod_name
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
      rbd_name: param.rbd_name
    }
  });
}
// 获取集群下的节点列表
export async function fetClusterNodeList(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/nodes`, {
    method: 'get',
    timeout: 8000,
    handleError
  });
}
// 节点操作
export async function editClusterNodeActive(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/nodes/${param.node_id}/action`, {
    method: 'post',
    data: {
      action: param.action
    }
  });
}
// 获取节点详情
export async function fetClusterNodeDetail(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/nodes/${param.node_id}`, {
    method: 'get',
    handleError
  });
}
// 获取节点标签
export async function fetClusterNodeLabels(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/nodes/${param.node_name}/labels`, {
    method: 'get',
    handleError
  });
}
// 更新节点标签
export async function updataClusterNodeLabels(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/nodes/${param.node_name}/labels`, {
    method: 'PUT',
    data: {
      labels: param.labels
    },
    handleError
  });
}

// 获取污点
export async function fetClusterNodeTaint(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/nodes/${param.node_name}/taints`, {
    method: 'get',
    handleError
  });
}
// 更新污点
export async function updataClusterNodeTaint(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/nodes/${param.node_name}/taints`, {
    method: 'put',
    data: {
      taints: param.taints
    },
    handleError
  });
}
// 获取rainbond组件信息
export async function fetDashboardList(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/rbd-components`, {
    method: 'get',
    timeout: 8000,
    handleError
  });
}
// 获取container数据
export async function fetClusterNodeContainer(param, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/regions/${param.region_name}/nodes/${param.node_name}/container`, {
    method: 'get',
    params: {
      container_runtime: param.container_runtime
    },
    handleError
  });
}
// 添加集群节点
export async function addClusterNode(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${params.enterprise_id}/rke2/nodes?cluster_id=${params.clusterID}`, {
    method: 'put',
    data: params.data,
    handleError
  });
}
// 获取集群节点列表
export async function fetchClusterNodeList(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${params.enterprise_id}/rke2/nodes`, {
    method: 'get',
    params: {
      cluster_id: params.clusterID,
    },
    handleError
  });
}

// 获取 helm 对接集群事件
export async function fetchHelmEvents(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${params.eid}/tasks/helm_region_install`, {
    method: 'get',
    handleError
  });
}

// 生成 helm 对接集群事件
export async function createHelmEvents(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${params.eid}/tasks/helm_region_install`, {
    method: 'post',
    data: {
      token: params.token,
      api_host: params.api_host
    },
    handleError
  });
}
// 获取k8s集群状态
export async function fetchClusterStatus(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${params.enterprise_id}/rke2/node/status`, {
    method: 'get',
    params: {
      cluster_id: params.clusterID
    },
    handleError
  });
}

// 删除 helm 对接集群事件
export async function deleteHelmEvents(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${params.eid}/tasks/helm_region_install`, {
    method: 'delete',
    handleError
  });
}

// 主机安装节点列表
export async function fetchClusterInfoList(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/cluster_node`, {
    method: 'get',
    params: {
      event_id: params.event_id || '',
      cluster_id: params.cluster_id || ''
    },
    handleError
  });
}

// 主机安装节点删除
export async function deleteClusterNode(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/cluster_node`, {
    method: 'delete',
    data: {
      node_name: params.node_name
    },
    handleError
  });
}

// 主机安装集群信息
export async function fetchClusterInfo(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/cluster`, {
    method: 'get',
    params:{
      cluster_id: params.cluster_id || ''
    },
    handleError
  });
}

// 主机安装节点ip
export async function fetchClusterNodeInfo(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/cluster_node_ip`, {
    method: 'get',
    handleError
  });
}
// 集群安装
export async function installCluster(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/cluster_install`, {
    method: 'post',
    data: {
      value_yaml: params.value_yaml,
      third_db: params.third_db,
      third_hub: params.third_hub
    },
    handleError
  });
}
// 获取集群安装所有pod信息
export async function installClusterAllPodinfo(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/rb_components_status`, {
    method: 'get',
    handleError
  });
}

// 获取集群安装单个pod信息
export async function installClusterPodinfo(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/rb_component_event`, {
    method: 'get',
    params: {
      pod_name: params.pod_name
    },
    handleError
  });
}
// 卸载主机安装的集群
export async function unInstallCluster(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/cluster_uninstall`, {
    method: 'post',
    handleError
  });
}
//  获取对接集群数据
export async function getReginConfig(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/region_config`, {
    method: 'get',
    handleError
  });
}

//  添加集群名称与id
export async function addReginConfig(data, handleError) {
  return request(`${apiconfig.baseUrl}/console/cluster`, {
    method: 'post',
    data: {
      cluster_name: data.cluster_name,
      cluster_id: data.cluster_id
    },
    handleError
  });
}

// 获取企业版授权信息
export async function getEnterpriseLicense(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/licenses`, {
    method: 'get',
    handleError
  });
}

// 更新授权码
export async function uploadEnterpriseLicense(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/licenses`, {
    method: 'post',
    data: {
      authz_code: params.authz_code
    },
    handleError
  });
}

// 可观测性
export async function fetchObservabilityOverview(params, handleError) {
  return request(`${apiconfig.baseUrl}/openapi/v1/overview`, {
    method: 'get',
    isToken: true,
    headers:{
      Authorization: params.token
    },
    handleError
  });
}
export async function fetchPerformanceOverview(params, handleError) {
  return request(`${apiconfig.baseUrl}/openapi/v1/monitor/performance_overview`, {
    method: 'get',
    isToken: true,
    headers:{
      Authorization: params.token
    },
    handleError
  });
}
// resource_over_view
// performance_overview
// 桑基图数据
export async function fetchResourceOverview(params, handleError) {
  return request(`${apiconfig.baseUrl}/openapi/v1/monitor/${params.type}`, {
    method: 'get',
    isToken: true,
    headers:{
      Authorization: params.token
    },
    handleError
  });
}
// 网络数据
export async function fetchQueryRange(params, handleError) {
  return request(`${apiconfig.baseUrl}/openapi/v1/monitor/query_range`, {
    method: 'get',
    isToken: true,
    headers:{
      Authorization: params.token
    },
    params: {
      query: params.query, //CPU使用趋势
      region_name: params.region_name, //集群唯一标识
      start: params.start, //开始时间七天前零点
      end: params.end, //结束时间当前
      step: params.step, //每个采样点间隔
    },
    handleError
  });
}
// 获取 Prometheus 节点信息
export async function fetchPrometheusNodeInfo(params, handleError) {
  return request(`${apiconfig.baseUrl}/console/regions/monitor`, {
    method: 'post',
    data: {
      url: params.url,
      data: params.data
    },
    handleError
  });
}
