import apiconfig from '../../config/api.config';
import request from '../utils/request';

/** 获取http数据 */
export async function queryHttpData(param) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${param.team_name}/domain/query`,
    {
      method: 'get',
      params: {
        page: param.page_num || 1,
        page_size: param.page_size || 15,
        search_conditions: param.search_conditions
      }
    }
  );
}

/** 获取app http rules */
export async function queryAppHttpData(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/team/${param.team_name}/app/${param.app_id}/domain`,
    {
      method: 'get',
      params: {
        page: param.page_num || 1,
        page_size: param.page_size || 15,
        search_conditions: param.search_conditions
      }
    }
  );
}

/** 获取连接信息 */
export async function fetchEnvs(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/envs`,
    {
      method: 'get',
      params: {
        env_type: 'outer'
      }
    }
  );
}
/** 获取参数配置 */
export async function getParameter(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/domain/${params.rule_id}/put_gateway`,
    {
      method: 'get',
      params: {
        rule_id: params.rule_id
      }
    }
  );
}

/** 设置参数配置 */
export async function editParameter(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/domain/${params.rule_id}/put_gateway`,
    {
      method: 'PUT',
      data: {
        rule_id: params.rule_id,
        value: params.value
      }
    }
  );
}
/** 获取所证书列表 */
export async function fetchAllLicense(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/certificates`,
    {
      method: 'get',
      params: {
        page_size: params.page_size || 10,
        page_num: params.page_num || 1
      }
    }
  );
}

/** 添加证书 */
export async function addLicense(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/certificates`,
    {
      method: 'post',
      data: {
        alias: params.alias,
        private_key: params.private_key,
        certificate: params.certificate,
        certificate_type: params.certificate_type
      }
    }
  );
}
/** 编辑证书 */
export async function editLicense(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/certificates/${params.certifiate_id}`,
    {
      method: 'PUT',
      data: {
        alias: params.alias,
        private_key: params.private_key,
        certificate: params.certificate,
        certificate_type: params.certificate_type
      }
    }
  );
}
/** 删除证书 */
export async function deleteLicense(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/certificates/${params.certifiate_id}`,
    {
      method: 'DELETE'
    }
  );
}
/** 查看证书详情 */
export async function queryDetail(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/certificates/${params.certifiate_id}`,
    {
      method: 'get'
    }
  );
}

/** 添加http策略 */
export async function addHttpStrategy(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/httpdomain`,
    {
      method: 'post',
      data: {
        auto_ssl: params.values.auto_ssl,
        auto_ssl_config: params.values.auto_ssl_config,
        container_port: params.values.container_port,
        certificate_id: params.values.certificate_id,
        domain_cookie: params.values.domain_cookie,
        domain_heander: params.values.domain_heander,
        domain_name: params.values.domain_name,
        domain_path: params.values.domain_path,
        group_id: params.values.group_id,
        rule_extensions:
          params.rule_extensions && params.rule_extensions.length
            ? params.rule_extensions
            : [],
        the_weight: params.values.the_weight,
        service_id: params.values.service_id,
        group_name: params.group_name,
        path_rewrite: params.values.path_rewrite || false,
        rewrites:
          params.values.rewrites && params.values.rewrites.length > 0
            ? params.values.rewrites
            : [],
        whether_open: !!params.values.whether_open, // 是否开启对外访问
        value: params.values.value || {},
      }
    }
  );
}

/** 删除http */
export async function deleteHttp(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/httpdomain`,
    {
      method: 'DELETE',
      data: {
        container_port: params.container_port,
        domain_name: params.domain_name,
        service_id: params.service_id,
        http_rule_id: params.http_rule_id
      }
    }
  );
}
/** 查询编辑详情 */
export async function queryDetail_http(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/httpdomain`,
    {
      method: 'get',
      params: {
        http_rule_id: params.http_rule_id
      }
    }
  );
}

/** 编辑http */
export async function editHttpStrategy(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/httpdomain`,
    {
      method: 'put',
      data: {
        auto_ssl: params.values.auto_ssl,
        auto_ssl_config: params.values.auto_ssl_config,
        container_port: params.values.container_port,
        certificate_id: params.values.certificate_id,
        domain_cookie: params.values.domain_cookie,
        domain_heander: params.values.domain_heander,
        domain_name: params.values.domain_name,
        domain_path: params.values.domain_path,
        group_id: params.values.group_id,
        rule_extensions:
          params.rule_extensions && params.rule_extensions.length
            ? params.rule_extensions
            : [],
        the_weight: params.values.the_weight,
        service_id: params.values.service_id,
        group_name: params.group_name,
        path_rewrite: params.values.path_rewrite || false,
        rewrites:
          params.values.rewrites && params.values.rewrites.length > 0
            ? params.values.rewrites
            : [],
        http_rule_id: params.http_rule_id,
        value: params.values.value || {},
      }
    }
  );
}
/** 查询tcp */
export async function queryTcpData(param) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${param.team_name}/tcpdomain/query`,
    {
      method: 'get',
      params: {
        page: param.page_num || 1,
        page_size: param.page_size || 15,
        search_conditions: param.search_conditions
      }
    }
  );
}

export async function queryAppTcpData(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/team/${param.team_name}/app/${param.app_id}/tcpdomain`,
    {
      method: 'get',
      params: {
        page: param.page_num || 1,
        page_size: param.page_size || 15,
        search_conditions: param.search_conditions
      }
    }
  );
}
/** 删除tcp */
export async function deleteTcp(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/tcpdomain`,
    {
      method: 'DELETE',
      data: {
        tcp_rule_id: params.tcp_rule_id,
        service_id: params.service_id
      }
    }
  );
}
/** 查询ip */
export async function querydomain_port(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/domain/get_port`,
    {
      method: 'get'
    }
  );
}
/** 查询tcp详细信息 */
export async function queryDetail_tcp(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/tcpdomain`,
    {
      method: 'get',
      params: {
        tcp_rule_id: params.tcp_rule_id
      }
    }
  );
}
/** 添加tcp */
export async function addTcp(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/tcpdomain`,
    {
      method: 'post',
      data: {
        container_port: params.values.container_port,
        end_point: `${params.values.end_point.ip}:${params.values.end_point.available_port}`.replace(
          /\s+/g,
          ''
        ),
        group_id: params.values.group_id.key,
        group_name: params.values.group_id.label,
        service_id: params.values.service_id,
        default_port: params.values.default_port,
        whether_open: !!params.values.whether_open,
        rule_extensions:
          params.rule_extensions && params.rule_extensions.length
            ? params.rule_extensions
            : [],
        default_ip: params.values.end_point.ip.replace(/\s+/g, '')
      }
    }
  );
}
/** 编辑tcp */
export async function editTcp(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/tcpdomain`,
    {
      method: 'put',
      data: {
        container_port: params.values.container_port,
        end_point: `${params.values.end_point.ip}:${params.values.end_point.available_port}`.replace(
          /\s+/g,
          ''
        ),
        group_id: params.values.group_id.key,
        group_name: params.values.group_id.label,
        service_id: params.values.service_id,
        default_port: params.values.default_port,
        type: params.values.type,
        whether_open: !!params.values.whether_open,
        rule_extensions:
          params.rule_extensions && params.rule_extensions.length
            ? params.rule_extensions
            : [],
        tcp_rule_id: params.tcp_rule_id,
        default_ip: params.values.end_point.ip.replace(/\s+/g, '')
      }
    }
  );
}

/** 查询应用状态 */
export async function query_app_status(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/status`,
    {
      method: 'get'
    }
  );
}

export async function startApp(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/start`,
    {
      method: 'post'
    }
  );
}

/* 获取网关 GateWayAPI 列表 */
export async function getGateWayApiList(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/batch-gateway-http-route`,
    {
      method: 'get',
      params:{
        app_id: params.app_id
      }
    }
  );
}

/* 获取网关 GateWay 下拉列表 */
export async function getBatchGateWay(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/regions/${params.region_name}/batch-gateway`,
    {
      method: 'get',
      handleError
    }
  );
}

/* 获取网关 GateWay IP 地址 */
export async function getGateWay(params) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${params.enterprise_id}/regions/${params.region_name}/gateway`,
    {
      method: 'get',
      params: {
        name: params.name,
        namespace: params.namespace
      }
    }
  );
}

/** 查询 GateWayApi 编辑详情 */
export async function queryDetailGateWayApi(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/gateway-http-route`,
    {
      method: 'get',
      params: {
        name: params.name,
        check: params.check
      }
    }
  );
}

/** 添加 GateWayApi 详情 */
export async function addDetailGateWayApi(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/gateway-http-route`,
    {
      method: 'post',
      data: {
        app_id: params.app_id,
        gateway_name: params.gateway_name,
        gateway_namespace: params.gateway_namespace,
        section_name:params.section_name == "all" ? "" : params.section_name,
        hosts: params.hosts,
        rules: params.rules,
      },
      handleError
    }
  );
}
/** 修改 GateWayApi 详情 */
export async function editDetailGateWayApi(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/gateway-http-route`,
    {
      method: 'put',
      data: {
        app_id: params.app_id,
        gateway_name: params.gateway_name,
        gateway_namespace: params.gateway_namespace,
        section_name:params.section_name == "all" ? "" : params.section_name,
        hosts: params.hosts,
        rules: params.rules,
        name: params.name
      },
      handleError
    }
  );
}

/** 删除 GateWayApi 详情 */
export async function deleteGateWayApi(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/gateway-http-route`,
    {
      method: 'DELETE',
      params: {
        name: params.name,
        region_app_id: params.app_id
      },
      handleError
    }
  );
}

/** 获取限流策略 */
export async function getLimitingStrategy(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/http-limiting-policy`,
    {
      method: 'get',
      handleError
    }
  );
}

/** 添加限流策略 */
export async function addLimitingStrategy(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/http-limiting-policy`,
    {
      method: 'post',
      data: {
        limiting_name: params.limiting_name,
        access_memory_size: params.access_memory_size,
        max_access_rate: params.max_access_rate, 
      },
      handleError
    }
  );
}

/** 删除限流策略 */
export async function deleteLimitingStrategy(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/http-limiting-policy`,
    {
      method: 'delete',
      data: {
        limiting_name: params.limiting_name,
      },
      handleError
    }
  );
}

/** 编辑限流策略 */
export async function editLimitingStrategy(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/http-limiting-policy`,
    {
      method: 'put',
      data: {
        limiting_name: params.limiting_name,
        access_memory_size: params.access_memory_size,
        max_access_rate: params.max_access_rate,
      },
      handleError
    }
  );
}

/** 获取Api-Gateway路由列表 */
export async function getApiGatewayList(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/api-gateway/v1/${params.teamName}/routes/${params.type}`,
    {
      method: 'get',
      params: {
        appID: params.appID,
      },
      handleError
    }
  );
}
/** 新增修改Api-Gateway路由 */
export async function handleApiGateway(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/api-gateway/v1/${params.teamName}/routes/${params.type}?appID=${ params.appID }&service_alias=${ params.service_alias }&name=${ params.name }`,
    {
      method: 'post',
      data: {
        ...params.values
      },
      handleError
    }
  );
}
/** 删除Api-Gateway路由 */
export async function deleteApiGateway(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/api-gateway/v1/${params.teamName}/routes/${params.type}/${ params.name }?appID=${params.appID}`,
    {
      method: 'delete',
      handleError
    }
  );
}

/** 获取Api-Gateway目标服务 */
export async function getApiGatewayService(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/api-gateway/v1/${params.teamName}/service`,
    {
      method: 'get',
      params: {
        appID: params.appID,
      },
      handleError
    }
  );
}
/** 新增或编辑Api-Gateway目标服务 */
export async function handleApiGatewayService(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/api-gateway/v1/${params.teamName}/service/${params.name}?appID=${ params.appID }`,
    {
      method: 'post',
      data: {
        ...params.values
      },
      handleError
    }
  );
}
/** 删除Api-Gateway目标服务 */
export async function deleteApiGatewayService(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/api-gateway/v1/${params.teamName}/service/${ params.name }?appID=${ params.appID }`,
    {
      method: 'delete',
      handleError
    }
  );
}

/** 新增或编辑Api-Gateway证书 */
export async function handleApiGatewayCert(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/api-gateway/v1/${params.teamName}/cert/${params.alias}`,
    {
      method: 'post',
      handleError
    }
  );
}



// 获取团队网关数据
export async function getTeamGatewayData(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/open/monitor/query`,
    {
      method: 'get',
      params: {
        query: params.query,
        start: params.start,
        end: params.end,
        step: params.step,
        region_name: params.regionName
      }
    }
  )
}
export async function deleteApiGatewayCert(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/api-gateway/v1/${params.teamName}/cert/${params.alias}`,
    {
      method: 'delete',
      handleError
    }
  );
}

// 获取服务地址列表
export function fetchGetServiceAddress(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/regions/${params.region_name}/apps_port`,
    {
      method: 'get',
    },
  );
}

// 获取tcp服务列表
export function fetchGetTcpService(params) {
  return request(
    `${apiconfig.baseUrl}/console/v2/proxy-pass/gateway/${params.teamName}/routes/tcp`,
    {
      method: 'get',
      params: {
        appID: params.appID,
        region_name: params.region_name
      },
    },
  );
}
// 编辑tcp服务
export function fetchEditTcpService(params) {
  return request(
    `${apiconfig.baseUrl}/console/v2/proxy-pass/gateway/${params.teamName}/routes/tcp?appID=${params.appID}&region_name=${params.region_name}`,
    {
      method: 'post',
      data: {
        ...params.values
      },
    },
  );
}

// 删除tcp服务
export function fetchDeleteTcpService(params) {
  return request(
    `${apiconfig.baseUrl}/console/v2/proxy-pass/gateway/${params.teamName}/routes/tcp/${params.name}?appID=${params.appID}&region_name=${params.region_name}`,
    {
      method: 'delete',
    },
  );
}

