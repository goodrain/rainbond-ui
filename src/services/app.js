/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
import apiconfig from '../../config/api.config';
import request from '../utils/request';

/* 删除应用的某个版本 */
export function delAppVersion(body = { team_name, service_alias, version_id }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/version/${body.version_id}`,
    {
      method: 'DELETE'
    }
  );
}

/* 获取应用所有的版本列表 */
export function getAppVersionList(
  body = { team_name, service_alias, page_num, page_size }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/version`,
    {
      method: 'get',
      params: {
        page_num: body.page_num,
        page_size: body.page_size
      }
    }
  );
}

/*
  获取php语言扩展
 */
export function getPhpConfig() {
  return request(`${apiconfig.baseUrl}/console/php`, {
    method: 'get'
  });
}

/*
  获取自动部署设置状态

 */
export function getAutoDeployStatus(
  body = { team_name, app_alias, deployment_way }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/webhooks/get-url?deployment_way=${body.deployment_way}`,
    {
      method: 'get'
    }
  );
}

/*
  取消自动部署
 */
export function cancelAutoDeploy(
  body = { team_name, app_alias, deployment_way }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/webhooks/status`,
    {
      method: 'post',
      data: {
        action: 'close',
        deployment_way: body.deployment_way
      }
    }
  );
}

/*
  开启自动部署
 */
export function openAutoDeploy(
  body = { team_name, app_alias, deployment_way }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/webhooks/status`,
    {
      method: 'post',
      data: {
        action: 'open',
        deployment_way: body.deployment_way
      }
    }
  );
}

/*
  获取应用的历史操作日志
*/
export function getActionLog(
  body = {
    team_name,
    app_alias,
    page,
    page_size,
    start_time
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/events`,
    {
      method: 'get',
      params: {
        page: body.page,
        page_size: body.page_size,
        start_time: body.start_time || ''
      }
    }
  );
}

/*
  获取应用某个操作历史的详细日志
  level {
   info, debug, error
  }
*/
export function getActionLogDetail(
  body = {
    team_name,
    app_alias,
    level,
    event_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/event_log`,
    {
      method: 'get',
      params: {
        level: body.level || 'info',
        event_id: body.event_id
      }
    }
  );
}

/*
  部署应用
*/
export function deploy(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/deploy`,
    {
      method: 'post',
      data: {
        is_upgrate: !!body.is_upgrate,
        group_version: body.group_version
      },
      handleError
    }
  );
}
export function upgrade(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/market_service/upgrade`,
    {
      method: 'post',
      data: {
        is_upgrate: !!body.is_upgrate,
        group_version: body.group_version
      },
      handleError
    }
  );
}

/*
  更新滚动
*/
export function updateRolling(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/upgrade`,
    {
      method: 'post'
    }
  );
}
/*
  批量部署应用
*/
export function batchDeploy(
  body = {
    team_name,
    serviceIds
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/batch_actions`,
    {
      method: 'post',
      data: {
        action: 'deploy',
        service_ids: body.serviceIds
      }
    }
  );
}

/*
  应用重启
*/
export function restart(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/restart`,
    { method: 'post' }
  );
}

/*
  批量操作
  stop: 停止组件
  start: 启动组件
  restart: 重启组件
  move: 移动组件
  upgrade: 更新组件
  deploy: 构建组件
*/
export function batchOperation(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/batch_actions`,
    {
      method: 'post',
      data: {
        action: body.action,
        service_ids: body.serviceIds
      }
    }
  );
}

/*
  应用启动
*/
export function start(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/start`,
    {
      method: 'post'
    }
  );
}
/*
  批量应用启动
*/
export function batchStart(
  body = {
    team_name,
    serviceIds
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/batch_actions`,
    {
      method: 'post',
      data: {
        action: 'start',
        service_ids: body.serviceIds
      }
    }
  );
}

/*
  应用关闭
*/
export function stop(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/stop`,
    {
      method: 'post'
    }
  );
}

/*
  批量应用关闭
*/
export function batchStop(
  body = {
    team_name,
    serviceIds
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/batch_actions`,
    {
      method: 'post',
      data: {
        action: 'stop',
        service_ids: body.serviceIds
      }
    }
  );
}

/*
  应用回滚
*/
export function rollback(
  body = {
    team_name,
    app_alias,
    deploy_version,
    upgrade_or_rollback
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/rollback`,
    {
      method: 'post',
      data: {
        deploy_version: body.deploy_version,
        upgrade_or_rollback: body.upgrade_or_rollback
          ? body.upgrade_or_rollback
          : -1
      }
    }
  );
}

/*
  获取应用详细信息
*/
export async function getDetail(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/detail`,
    {
      method: 'get',
      handleError
    }
  );
}

/*
  获取应用状态
*/
export function getComponentState(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/status`,
    {
      method: 'get',
      handleError,
      showLoading: false
    }
  );
}

/*
  获取监控日志--日志页面
*/
export function getServiceLog(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/log`,
    {
      method: 'get',
      params: {
        action: 'service',
        lines: body.lines || 50
      }
    }
  );
}
export function getContainerLog(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/logs`,
    {
      method: 'get',
      params: {
        pod_name: body.pod_name,
        container_name: body.container_name
      }
    }
  );
}

/*
  获取监控日志的websocket地址
*/
export function getMonitorWebSocketUrl(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/log_instance`,
    { method: 'get' }
  );
}

/*
  历史日志下载
*/
export function getHistoryLog(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/history_log`,
    { method: 'get' }
  );
}

/*
  水平升级
  new_node : 节点数量
*/
export function horizontal(
  body = {
    team_name,
    app_alias,
    new_node
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/horizontal`,
    {
      method: 'post',
      data: {
        new_node: body.new_node
      }
    }
  );
}

/*
  垂直升级
  new_memory : 内存数量 单位 MB
*/
export function vertical(
  body = {
    team_name,
    app_alias,
    new_memory
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/vertical`,
    {
      method: 'post',
      data: {
        new_memory: body.new_memory,
        new_gpu: body.new_gpu,
        new_cpu: body.new_cpu
      }
    }
  );
}

/*
  获取应用已依赖的其他应用
*/
export function getRelationedApp(
  body = {
    team_name,
    app_alias,
    page,
    pageSize
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/dependency`,
    {
      method: 'get',
      params: {
        page: body.page,
        page_size: body.pageSize
      }
    }
  );
}

/*
  获取应用可以依赖的应用
*/
export function getUnRelationedApp(
  body = {
    team_name,
    app_alias,
    page,
    page_size,
    search_key,
    condition
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/un_dependency`,
    {
      method: 'get',
      params: {
        page: body.page || 1,
        page_size: body.page_size || 8,
        condition: body.condition,
        search_key: body.search_key
      }
    }
  );
}

/*
  添加依赖的应用
*/
export function addRelationedApp(
  body = {
    team_name,
    app_alias,
    dep_service_id,
    container_port,
    open_inner
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/dependency`,
    {
      method: 'post',
      data: {
        dep_service_id: body.dep_service_id,
        container_port: body.container_port ? body.container_port : '',
        open_inner: body.open_inner ? body.open_inner : ''
      }
    }
  );
}

/*
  添加依赖的应用
*/
export function batchAddRelationedApp(
  body = {
    team_name,
    app_alias,
    dep_service_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/dependency`,
    {
      method: 'patch',
      data: {
        dep_service_ids: body.dep_service_ids.join(',')
      }
    }
  );
}

/*
  删除依赖的应用
*/
export function removeRelationedApp(
  body = {
    team_name,
    app_alias,
    dep_service_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/dependency/${body.dep_service_id}`,
    { method: 'delete' }
  );
}

/*
  获取挂载或未挂载的目录
  type: 查询的类别 mnt（已挂载的,默认）| unmnt (未挂载的)
  volume_type: 查询的类别 share-file(非配置文件) | config-file(配置文件)
*/
export function getMnt(
  body = {
    team_name,
    app_alias,
    page,
    pageSize,
    type,
    volume_type,
    query
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/mnt`,
    {
      method: 'get',
      params: {
        query: body.query,
        page: body.page,
        page_size: body.page_size,
        type: body.type ? body.type : 'mnt',
        volume_types: body.volume_type
          ? body.volume_type
          : ['share-file', 'memoryfs', 'local']
      },
      paramsSerializer(params) {
        const yourNewParams = params.volume_types
          .map(_ => `volume_types=${_}`)
          .join('&');
        const str = `query=${params.query}&page=${params.page}&page_size=${params.page_size}&type=${params.type}&${yourNewParams}`;
        return str;
      }
    }
  );
}

/*
   为应用挂载其他应用共享的存储
   body [{"id":49,"path":"/add"},{"id":85,"path":"/dadd"}]
*/
export function addMnt(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/mnt`,
    {
      method: 'post',
      data: {
        body: JSON.stringify(body.body || [])
      }
    }
  );
}

/*
  取消挂载依赖
*/
export async function deleteMnt(
  body = {
    team_name,
    app_alias,
    dep_vol_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/mnt/${body.dep_vol_id}`,
    { method: 'delete' }
  );
}

/*
  获取应用的端口
*/
export async function getPorts(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports`,
    {
      method: 'get'
    }
  );
}

/*
   修改端口协议
*/

export async function changePortProtocal(
  body = {
    team_name,
    app_alias,
    port,
    protocol
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports/${body.port}`,
    {
      method: 'put',
      data: {
        action: 'change_protocol',
        protocol: body.protocol
      }
    }
  );
}

/*
  打开端口外部访问 only_open_outer
*/
export async function openPortOuter(
  body = {
    team_name,
    app_alias,
    port,
    action
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports/${body.port}`,
    {
      method: 'put',
      data: {
        action: body.action ? body.action : 'open_outer'
      }
    }
  );
}

/*
  关闭端口外部访问
*/
export async function closePortOuter(
  body = {
    team_name,
    app_alias,
    port
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports/${body.port}`,
    {
      method: 'put',
      data: {
        action: 'close_outer'
      }
    }
  );
}

/*
  打开端口内部访问
*/
export async function openPortInner(
  body = {
    team_name,
    app_alias,
    port
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports/${body.port}`,
    {
      method: 'put',
      data: {
        action: 'open_inner'
      }
    }
  );
}

/*
  关闭端口内部访问
*/
export async function closePortInner(
  body = {
    team_name,
    app_alias,
    port
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports/${body.port}`,
    {
      method: 'put',
      data: {
        action: 'close_inner'
      }
    }
  );
}

/*
   修改端口别名
*/
export async function editPortAlias(
  body = {
    team_name,
    app_alias,
    port,
    port_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports/${body.port}`,
    {
      method: 'put',
      data: {
        action: 'change_port_alias',
        k8s_service_name: body.k8s_service_name,
        port_alias: body.port_alias
      }
    }
  );
}

/*
  删除端口
*/
export async function deletePort(
  body = {
    team_name,
    app_alias,
    port
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports/${body.port}`,
    { method: 'delete' }
  );
}

/*
  绑定域名
*/
export async function bindDomain(
  body = {
    team_name,
    app_alias,
    port,
    domain,
    protocol,
    certificate_id,
    group_id,
    rule_extensions
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/domain`,
    {
      method: 'post',
      data: {
        domain_name: body.domain,
        container_port: body.port,
        protocol: body.protocol,
        certificate_id: body.certificate_id,
        group_id: body.group_id,
        rule_extensions:
          body.rule_extensions.length > 0 ? body.rule_extensions : []
      }
    }
  );
}

/*
  解绑域名
*/
export async function unbindDomain(
  body = {
    team_name,
    app_alias,
    port,
    domain
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/domain`,
    {
      method: 'delete',
      data: {
        domain_name: body.domain,
        container_port: body.port
      }
    }
  );
}

/*
  添加端口
*/
export async function addPort(
  body = {
    team_name,
    app_alias,
    port,
    protocol
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/ports`,
    {
      method: 'post',
      data: {
        port: body.port,
        protocol: body.protocol
      }
    }
  );
}
/*
 获取应用的自定义环境变量
 evn
*/
export async function getInnerEnvs(
  body = {
    team_name,
    app_alias,
    env_type,
    page,
    page_size,
    env_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/envs`,
    {
      method: 'get',
      params: {
        env_type: body.env_type ? body.env_type : 'inner',
        page: body.page ? body.page : 1,
        page_size: body.page_size ? body.page_size : 5,
        env_name: body.env_name ? body.env_name : ''
      }
    }
  );
}

/*
  获取版本的信息
*/
export async function getBuildInformation(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/market_service/upgrade`,
    {
      method: 'get'
    }
  );
}

/*
  获取变量值信息
*/
export async function getVariable(
  body = {
    attr_name,
    page,
    page_size
  }
) {
  return request(`${apiconfig.baseUrl}/console/enterprise/diy_envs`, {
    method: 'get',
    params: {
      attr_name: body.attr_name,
      page: body.page,
      page_size: body.page_size
    }
  });
}

/*
 删除应用的环境变量值
*/
export async function deleteVariable(
  body = {
    diy_id
  }
) {
  return request(`${apiconfig.baseUrl}/console/enterprise/diy_envs`, {
    method: 'delete',
    data: {
      diy_id: body.diy_id
    }
  });
}

/*
 添加应用的自定义环境变量
 name ： 说明
*/
export async function addInnerEnvs(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/envs`,
    {
      method: 'post',
      data: {
        name: body.name,
        attr_name: body.attr_name || '',
        attr_value: body.attr_value || '',
        scope: body.scope ? body.scope : 'inner',
        is_change: true
      }
    }
  );
}

/*
 获取应用的连接信息变量
 evn
*/
export async function getOuterEnvs(
  body = {
    team_name,
    app_alias,
    env_type,
    page,
    page_size,
    env_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/envs`,
    {
      method: 'get',
      params: {
        env_type: 'outer',
        page: body.page ? body.page : 1,
        env_name: body.env_name ? body.env_name : '',
        page_size: body.page_size ? body.page_size : 5
      }
    }
  );
}

/*
 添加应用的自定义环境变量
 name ： 说明
*/
export async function addOuterEnvs(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/envs`,
    {
      method: 'post',
      data: {
        name: body.name,
        attr_name: body.attr_name,
        attr_value: body.attr_value || '',
        scope: 'outer'
      }
    }
  );
}

/*
 修改应用的环境变量
 name ： 说明
*/
export async function editEvns(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/envs/${body.ID}`,
    {
      method: 'put',
      data: {
        name: body.name,
        attr_value: body.attr_value || ''
      }
    }
  );
}

/*
 删除应用的环境变量
*/
export async function deleteEvns(
  body = {
    team_name,
    app_alias,
    ID
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/envs/${body.ID}`,
    { method: 'delete' }
  );
}

/*
 转移环境变量
*/
export async function putTransfer(
  body = {
    team_name,
    app_alias,
    ID,
    scope
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/envs/${body.ID}`,
    {
      method: 'patch',
      data: {
        scope: body.scope
      }
    }
  );
}

/*
 获取实例数据 teams/(?P<tenantName>[\w\-]+)/apps/(?P<serviceAlias>[\w\-]+)/third_party/pods
*/

export async function getInstanceList(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/third_party/pods`,
    { method: 'get' }
  );
}
/*
 删除实例数据
*/
export async function deleteInstanceList(
  body = {
    team_name,
    app_alias,
    ep_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/third_party/pods`,
    {
      method: 'delete',
      data: {
        ep_id: body.ep_id
      }
    }
  );
}
/*
  添加/编辑实例数据
*/
export async function modifyInstanceList(
  body = {
    team_name,
    app_alias,
    ep_id,
    is_online
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/third_party/pods`,
    {
      method: 'put',
      data: {
        ep_id: body.ep_id,
        is_online: body.is_online
      }
    }
  );
}

/*
  添加/编辑实例数据
*/
export async function addInstanceList(
  body = {
    team_name,
    app_alias,
    endpoints_type
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/third_party/pods`,
    {
      method: 'POST',
      data: {
        ip: body.ip
      }
    }
  );
}
/*
  编辑实例数据
*/
export async function editUpDatekey(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/third_party/updatekey`,
    {
      method: 'put'
    }
  );
}

/*
 获取实例数据 teams/(?P<tenantName>[\w\-]+)/apps/(?P<serviceAlias>[\w\-]+)/third_party/pods
*/

export async function getHealthList(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/3rd-party/health`,
    { method: 'get' }
  );
}

export async function editorHealthList(
  body = {
    team_name,
    app_alias,
    scheme,
    time_interval,
    port,
    max_error_num,
    action,
    path
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/3rd-party/health`,
    {
      method: 'put',
      data: {
        mode: 'readiness',
        scheme: body.scheme,
        time_interval: body.time_interval,
        port: body.port,
        max_error_num: body.max_error_num,
        action: body.action,
        path: body.path
      }
    }
  );
}

/*

/*
  获取应用运行时探测的信息
*/
export async function getRunningProbe(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/probe`,
    {
      method: 'get',
      params: {
        // mode: "liveness",
      }
    }
  );
}

/*
  获取应用启动时探测的信息
*/
export async function getStartProbe(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/probe`,
    {
      method: 'get',
      params: {
        // mode: "readiness",
      }
    }
  );
}

/*
  添加/编辑应用启动时探测
*/
export async function addStartProbe(
  body = {
    team_name,
    app_alias,
    scheme,
    path,
    port,
    initial_delay_second,
    period_second,
    timeout_second,
    success_threshold,
    mode
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/probe`,
    {
      method: 'post',
      data: {
        mode: body.mode ? body.mode : 'readiness',
        scheme: body.scheme,
        path: body.path,
        port: body.port,
        http_header: body.http_header,
        initial_delay_second: body.initial_delay_second
          ? Number(body.initial_delay_second)
          : 0,
        period_second: body.period_second ? Number(body.period_second) : 0,
        timeout_second: body.timeout_second ? Number(body.timeout_second) : 0,
        success_threshold: body.success_threshold
          ? Number(body.success_threshold)
          : 0
      }
    }
  );
}

/*
  添加/编辑应用运行时探测
*/
export async function addRunningProbe(
  body = {
    team_name,
    app_alias,
    scheme,
    path,
    port,
    initial_delay_second,
    period_second,
    timeout_second,
    failure_threshold
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/probe`,
    {
      method: 'post',
      data: {
        mode: 'liveness',
        scheme: body.scheme,
        path: body.path,
        port: body.port,
        http_header: body.http_header,
        initial_delay_second: body.initial_delay_second
          ? Number(body.initial_delay_second)
          : 0,
        period_second: body.period_second ? Number(body.period_second) : 0,
        timeout_second: body.timeout_second ? Number(body.timeout_second) : 0,
        failure_threshold: body.failure_threshold
      }
    }
  );
}

/*
  添加/编辑应用启动时探测
*/
export async function editStartProbe(
  body = {
    team_name,
    app_alias,
    scheme,
    path,
    port,
    initial_delay_second,
    period_second,
    timeout_second,
    success_threshold,
    is_used,
    cmd
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/probe`,
    {
      method: 'put',
      data: {
        mode: body.mode ? body.mode : 'readiness',
        scheme: body.scheme || '',
        path: body.path || '',
        port: body.port || '',
        http_header: body.http_header || '',
        initial_delay_second: body.initial_delay_second
          ? Number(body.initial_delay_second)
          : 0,
        period_second: body.period_second ? Number(body.period_second) : 0,
        timeout_second: body.timeout_second ? Number(body.timeout_second) : 0,
        success_threshold: body.success_threshold
          ? Number(body.success_threshold)
          : 0,
        is_used: body.is_used === void 0 ? true : body.is_used,
        old_mode: body.old_mode ? body.old_mode : '',
        cmd:body.cmd || ''
      }
    }
  );
}

/*
  添加/编辑应用运行时探测
*/
export async function editRunningProbe(
  body = {
    team_name,
    app_alias,
    scheme,
    path,
    port,
    initial_delay_second,
    period_second,
    timeout_second,
    failure_threshold,
    is_used
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/probe`,
    {
      method: 'put',
      data: {
        mode: 'liveness',
        scheme: body.scheme,
        path: body.path,
        port: body.port,
        http_header: body.http_header,
        initial_delay_second: body.initial_delay_second
          ? Number(body.initial_delay_second)
          : 0,
        period_second: body.period_second ? Number(body.period_second) : 0,
        timeout_second: body.timeout_second ? Number(body.timeout_second) : 0,
        failure_threshold: body.failure_threshold,
        is_used: body.is_used === void 0 ? true : body.is_used
      }
    }
  );
}

/*
  获取应用基本详情
*/
export async function getBaseInfo(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/brief`,
    {
      method: 'get'
    }
  );
}

/*
  获取组件存储列表
    is_config: 是否是配置文件类型

*/
export async function getVolumes(
  body = {
    team_name,
    app_alias,
    is_config
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/volumes`,
    {
      method: 'get',
      params: {
        is_config: body.is_config
      }
    }
  );
}

/*
  获取组件支持的存储类型
*/
export async function getVolumeOpts(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/volume-opts`,
    {
      method: 'get'
    }
  );
}

/*
  添加组件的存储
*/
export async function addVolume(
  body = {
    team_name,
    app_alias,
    volume_name,
    volume_type,
    volume_path,
    volume_capacity,
    file_content
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/volumes`,
    {
      method: 'post',
      data: {
        volume_name: body.volume_name,
        volume_type: body.volume_type,
        volume_path: body.volume_path,
        mode: body.mode,
        volume_capacity: new Number(body.volume_capacity),
        file_content: body.volume_type == 'config-file' ? body.file_content : ''
      }
    }
  );
}
/*
  编辑应用的持久化路径
*/
export async function editorVolume(
  body = {
    team_name,
    app_alias,
    ID,
    new_volume_path,
    file_content
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/volumes/${body.ID}`,
    {
      method: 'put',
      data: {
        mode: body.mode,
        new_volume_path: body.new_volume_path,
        new_file_content: body.new_file_content
      }
    }
  );
}

/*
  删除应用的某个持久化目录
*/
export async function deleteVolume(
  body = {
    team_name,
    app_alias,
    volume_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/volumes/${body.volume_id}`,
    { method: 'delete' }
  );
}
export function getPerformanceAnalysis(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.teamName}/apps/${body.app_alias}/monitor/query_range`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: body.query,
        disable_auto_label: body.disable_auto_label,
        start: body.start || new Date().getTime() / 1000 - 60 * 60,
        end: body.end || new Date().getTime() / 1000,
        step: body.step || 72
      },
      showLoading: false
    }
  );
}
/*
   获取应用平均响应时间监控数据(当前请求时间点的数据)
*/
export async function getAppRequestTime(
  body = {
    team_name,
    app_alias,
    serviceId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `ceil(avg(app_requesttime{mode="avg",service_id="${body.serviceId}"}))`
      },
      showLoading: false
    }
  );
}

/*
   获取应用平均响应时间监控数据(一段时间内数据)
*/
export async function getAppRequestTimeRange(
  body = {
    team_name,
    app_alias,
    serviceId,
    step: 7,
    start,
    end
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query_range`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `ceil(avg(app_requesttime{mode="avg",service_id="${body.serviceId}"}))`,
        start: body.start,
        end: body.end || new Date().getTime() / 1000,
        step: body.step
      },
      showLoading: false
    }
  );
}

/*
   获取应用吞吐率监控数据(当前请求时间点的数据)
*/
export async function getAppRequest(
  body = {
    team_name,
    app_alias,
    serviceId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `sum(ceil(increase(app_request{service_id="${body.serviceId}",method="total"}[1m])/12))`
      },
      showLoading: false
    }
  );
}

/*
   获取应用吞磁盘监控数据(当前请求时间点的数据)
*/
export async function getAppDisk(
  body = {
    team_name,
    app_alias,
    serviceId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `app_resource_appfs{service_id="${body.serviceId}"}`
      },
      showLoading: false
    }
  );
}

/*
   获取应用吞磁盘监控数据(当前请求时间点的数据)
*/
export async function getAppMemory(
  body = {
    team_name,
    app_alias,
    serviceId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `app_resource_appmemory{service_id="${body.serviceId}"}`
      },
      showLoading: false
    }
  );
}

/*
   获取应用吞吐率监控数据(一段时间内数据)
*/
export async function getAppRequestRange(
  body = {
    team_name,
    app_alias,
    serviceId,
    step: 7,
    start,
    end
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query_range`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `sum(ceil(increase(app_request{service_id="${body.serviceId}",method="total"}[1m])/12))`,
        start: body.start,
        end: body.end || new Date().getTime() / 1000,
        step: body.step
      },
      showLoading: false
    }
  );
}

/*
  获取应用在线人数监控数据(当前请求时间点的数据)
*/
export async function getAppOnlineNumber(
  body = {
    team_name,
    app_alias,
    serviceId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `max(app_requestclient{service_id="${body.serviceId}"})`
      },
      showLoading: false
    }
  );
}

/*
  获取应用在线人数监控数据(一段时间内数据)
*/
export async function getAppOnlineNumberRange(
  body = {
    team_name,
    app_alias,
    serviceId,
    step: 7,
    start,
    end
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query_range`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `max(app_requestclient{service_id="${body.serviceId}"})`,
        start: body.start,
        end: body.end || new Date().getTime() / 1000,
        step: body.step
      },
      showLoading: false
    }
  );
}

/* 获取应用的代码分支 */
export function getCodeBranch(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/code/branch`,
    { method: 'get' }
  );
}

/* 设置应用的代码分支 */
export function setCodeBranch(
  body = {
    team_name,
    app_alias,
    branch
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/code/branch`,
    {
      method: 'put',
      data: {
        branch: body.branch
      }
    }
  );
}

/*
获取应用的伸缩信息
*/
export async function getExtendInfo(
  body = {
    team_name,
    app_alias
  },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/extend_method`,
    {
      method: 'get',
      handleError
    }
  );
}

/*
  获取应用的实例
*/
export async function getPods(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/pods`,
    {
      method: 'get',
      handleError
    }
  );
}
/*
  开启自动伸缩
*/
export async function newaddScalingRules(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenant_name}/apps/${params.service_alias}/xparules`,
    {
      method: 'post',
      data: {
        xpa_type: params.xpa_type ? params.xpa_type : 'hpa',
        enable: params.enable,
        min_replicas: params.minNum ? params.minNum : 1,
        max_replicas: params.maxNum ? params.maxNum : 2,
        metrics: params.metrics
      }
    }
  );
}
/*
  获取自动伸缩列表
*/
export async function getScalingRules(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenant_name}/apps/${params.service_alias}/xparules`,
    {
      method: 'get'
    }
  );
}
/*
  编辑自动伸缩
*/
export async function editScalingRules(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenant_name}/apps/${params.service_alias}/xparules/${params.rule_id}`,
    {
      method: 'put',
      data: {
        xpa_type: params.xpa_type ? params.xpa_type : 'hpa',
        enable: params.enable,
        min_replicas: params.minNum ? params.minNum : 1,
        max_replicas: params.maxNum ? params.maxNum : 2,
        metrics: params.metrics
          ? params.metrics
          : [
            {
              metric_type: 'resource_metrics',
              metric_name: 'cpu',
              metric_target_type: params.selectCpu ? params.selectCpu : '',
              metric_target_value: params.cpuValue ? params.cpuValue : 1
            },
            {
              metric_type: 'resource_metrics',
              metric_name: 'memory',
              metric_target_type: params.selectMemory
                ? params.selectMemory
                : '',
              metric_target_value: params.memoryValue ? params.memoryValue : 1
            }
          ]
      }
    }
  );
}
/* 获取伸缩记录 */
export async function queryScalingRecord(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenant_name}/apps/${params.service_alias}/xparecords`,
    {
      method: 'get',
      params: {
        page: params.page,
        page_size: params.page_size
      }
    }
  );
}
/*
  管理实例
*/
export async function managePods(
  body = {
    team_name,
    app_alias,
    pod_name,
    manage_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/pods`,
    {
      method: 'post',
      data: {
        c_id: body.pod_name,
        h_id: body.manage_name
      }
    }
  );
}

/*
 伸缩信息
*/
export async function TelescopicInfo(
  body = {
    team_name,
    service_alias,
    rule_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/xparules/${body.rule_id}`,
    {
      method: 'get'
    }
  );
}
/*
   获取应用的访问信息
*/
export async function getVisitInfo(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/visit`,
    {
      method: 'get',
      handleError,
      showLoading: false
    }
  );
}

/*
  获取应用标签
*/
export async function getTags(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/labels`,
    { method: 'get' }
  );
}

/*
  删除应用标签
*/
export async function deleteTag(
  body = {
    team_name,
    app_alias,
    label_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/labels`,
    {
      method: 'delete',
      data: {
        label_id: body.label_id
      }
    }
  );
}

/*
  添加标签
*/
export async function addTags(
  body = {
    teamName,
    app_alias,
    label_ids
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/labels`,
    {
      method: 'post',
      data: {
        label_ids: body.label_ids
      }
    }
  );
}

/*
  修改组件名称信息
*/
export async function editName(
  body = {
    team_name,
    app_alias,
    service_cname
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/brief`,
    {
      method: 'put',
      data: {
        service_cname: body.service_cname,
        k8s_component_name: body.k8s_component_name
      }
    }
  );
}

/*
  修改对外端口拓扑图teams/(?P<tenantName>[\w\-]+)/apps/(?P<serviceAlias>[\w\-]+)/topological/ports
*/
export async function openExternalPort(
  body = {
    team_name,
    app_alias,
    container_port,
    open_outer,
    close_outer
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/topological/ports`,
    {
      method: 'put',
      data: {
        open_outer: body.open_outer ? body.open_outer : '',
        container_port: body.container_port ? body.container_port : '',
        close_outer: body.close_outer ? body.close_outer : ''
      }
    }
  );
}

/*
  转移组
*/
export async function moveName(
  body = {
    team_name,
    app_alias,
    service_cname
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/brief`,
    {
      method: 'put',
      data: {
        service_cname: body.service_cname
      }
    }
  );
}

export function batchMove(
  body = {
    team_name,
    serviceIds,
    move_group_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/batch_actions`,
    {
      method: 'post',
      data: {
        action: 'move',
        service_ids: body.serviceIds,
        move_group_id: body.move_group_id
      }
    }
  );
}

/*
  获取设置了权限的团队成员
*/
export async function getMembers(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/perms`,
    {
      method: 'get'
    }
  );
}

/*
  获取团队成员
*/
export async function getPermissions() {
  return request(
    `${apiconfig.baseUrl}/console/teams/three_service/operate_options`,
    {
      method: 'get'
    }
  );
}
/*
  获取实例详情
*/
export async function fetchInstanceDetails(
  body = {
    team_name,
    app_alias,
    pod_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/pods/${body.pod_name}/detail`,
    {
      method: 'get'
    }
  );
}

export async function fetchHelmInstanceDetails(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_alias}/pods/${body.pod_name}`,
    {
      method: 'get'
    }
  );
}

/*
  获取操作日志
*/
export async function fetchOperationLog(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/events`,
    {
      method: 'get',
      params: {
        page: body.page ? body.page : 1,
        page_size: body.page_size ? body.page_size : 10,
        targetAlias: body.app_alias ? body.app_alias : '',
        target: body.target ? body.target : 'service'
      },
      handleError
    }
  );
}

/*
  获取操作记录日志
*/
export async function fetchLogContent(
  body = {
    team_name,
    eventID
    // service','plugin'
  }
) {
  // console/teams/{tenantAlias}/events/{eventID}/log
  // http://localhost:7070/console/teams/{tenantAlias}/{eventID}/logcontent
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/events/${body.eventID}/log`,
    {
      method: 'get',
      params: {
        eventID: body.eventID ? body.eventID : ''
      }
    }
  );
}

export async function getMavensettings(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/regions/${body.region_name}/mavensettings`,
    {
      method: 'get',
      params: {
        onlyname: body.onlyname
      }
    }
  );
}

export async function addMavensettings(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/regions/${body.region_name}/mavensettings`,
    {
      method: 'post',
      data: {
        name: body.name,
        content: body.content
      }
    }
  );
}

export async function editMavensettings(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/regions/${body.region_name}/mavensettings/${body.name}`,
    {
      method: 'put',
      data: {
        content: body.content
      }
    }
  );
}

export async function deleteMavensettings(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/regions/${body.region_name}/mavensettings/${body.name}`,
    {
      method: 'delete'
    }
  );
}

/*
  设置用户权限
*/
export async function setMemberAction(
  body = {
    team_name,
    app_alias,
    user_ids: [],
    perm_ids
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/perms`,
    {
      method: 'post',
      data: {
        user_ids: body.user_ids.join(','),
        perm_ids: body.perm_ids
      }
    }
  );
}

/*
  删除成员应用权限
*/
export async function deleteMember(
  body = {
    team_name,
    app_alias,
    user_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/perms`,
    {
      method: 'delete',
      data: {
        user_id: body.user_id
      }
    }
  );
}

/*
  修改用户权限
*/
export async function editMemberAction(
  body = {
    team_name,
    app_alias,
    user_id,
    perm_ids
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/perms`,
    {
      method: 'put',
      data: {
        user_id: body.user_id,
        perm_ids: body.perm_ids
      }
    }
  );
}

/*
  获取变量的信息
*/
export async function getVariableList(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/services/envs`,
    {
      method: 'get',
      params: {
        attr_name: body.attr_name ? body.attr_name : '',
        attr_value: body.attr_value ? body.attr_value : ''
      },
      handleError
    }
  );
}

/*
  修改应用所属组
*/
export async function moveGroup(
  body = {
    team_name,
    app_alias,
    group_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/group`,
    {
      method: 'put',
      data: {
        group_id: body.group_id
      }
    }
  );
}

/*
  获取应用的运行环境信息
*/
export async function getRuntimeInfo(
  body = {
    team_name,
    app_alias,
    group_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/compile_env`,
    { method: 'get' }
  );
}
/*
  获取构建的运行环境信息
*/
export async function getRuntimeBuildInfo(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/build_envs`,
    { method: 'get' }
  );
}

/*
  修改应用的运行环境信息
*/
export async function editRuntimeInfo(
  body = {
    team_name,
    app_alias,
    service_runtimes,
    service_server,
    service_dependency
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/compile_env`,
    {
      method: 'put',
      data: {
        // 服务运行版本，如php5.5等
        service_runtimes: body.service_runtimes,
        // 服务使用的服务器，如tomcat,apache,nginx等
        service_server: body.service_server,
        // 服务依赖，如php-mysql扩展等
        service_dependency: body.service_dependency
      }
    }
  );
}

/*
  修改应用的运行环境信息
*/
export async function editRuntimeBuildInfo(
  body = {
    team_name,
    app_alias,
    build_env_dict
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/build_envs`,
    {
      method: 'put',
      data: {
        build_env_dict: body.build_env_dict
      }
    }
  );
}
/*
  应用未创建阶段的信息修改
  可部分修改
*/

export async function editAppCreateInfo(
  body = {
    team_name,
    app_alias,
    service_cname,
    image,
    cmd,
    git_url,
    min_memory,
    extend_method,
    user_name,
    password,
    schedule:"*/1 * * * *",
    disk_cap
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/check_update`,
    {
      method: 'put',
      data: body
    }
  );
}

/*
  删除应用
  is_force:	true直接删除，false进入回收站
  未创建成功的直接删除、 已经创建的进入回收站
*/
export async function deleteApp(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/delete`,
    {
      method: 'delete',
      data: {
        is_force: true
      },
      handleError
    }
  );
}

/*
  批量应用删除
*/
export function batchDelete(
  body = {
    team_name,
    serviceIds
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/batch_delete`,
    {
      method: 'delete',
      data: {
        service_ids: body.serviceIds
      }
    }
  );
}

/*
  二次确认强制删除
*/
export function reDelete(
  body = {
    team_name,
    service_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/again_delete`,
    {
      method: 'delete',
      data: {
        service_id: body.service_id
      }
    }
  );
}

/*
  查询应用的性能分析插件
*/
export async function getAnalyzePlugins(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/analyze_plugins`,
    { method: 'get' }
  );
}

/*
  获取应用的插件信息, 包括已安装的和未安装的
*/
export async function getPlugins(
  body = {
    team_name,
    app_alias,
    category
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/pluginlist`,
    {
      method: 'get',
      params: {
        category: body.category
      }
    }
  );
}

/*
  获取JavaMaven多模块信息
*/
export async function getMultipleModulesInfo(
  body = {
    team_name,
    check_uuid
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/multi/check?check_uuid=${body.check_uuid}`,
    {
      method: 'get'
    }
  );
}

/*
  创建JavaMaven多模块信息
http://192.168.1.200:7070/console/teams/{tenant_name}/groups/{group_id}/multi/create
  http://192.168.1.200:7070/console/teams/nxkwpqt2/apps/gr73604f/multi/create
*/
export async function createService(
  body = {
    team_name,
    app_alias,
    service_infos
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/multi/create`,
    {
      method: 'post',
      data: {
        service_infos: body.service_infos
      }
    }
  );
}
/*
  开通插件
*/
export async function installPlugin(
  body = {
    team_name,
    app_alias,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/plugins/${body.plugin_id}/install`,
    {
      method: 'post',
      data: {
        build_version: body.build_version
      }
    }
  );
}

/*
  卸载插件
*/
export async function unInstallPlugin(
  body = {
    team_name,
    app_alias,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/plugins/${body.plugin_id}/install`,
    { method: 'delete' }
  );
}

/*
  启用插件
*/
export async function startPlugin(
  body = {
    team_name,
    app_alias,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/plugins/${body.plugin_id}/open`,
    {
      method: 'put',
      data: {
        is_switch: true,
        min_memory: body.min_memory
      }
    }
  );
}

/*
  更新插件内存
*/
export async function updatePluginMemory(
  body = {
    team_name,
    app_alias,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/plugins/${body.plugin_id}/open`,
    {
      method: 'put',
      data: {
        min_memory: body.min_memory,
        min_cpu: body.min_cpu
      }
    }
  );
}

/*
  停用插件
*/
export async function stopPlugin(
  body = {
    team_name,
    app_alias,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/plugins/${body.plugin_id}/open`,
    {
      method: 'put',
      data: {
        is_switch: false
      }
    }
  );
}

/*
   获取插件的配置信息
*/
export async function getPluginConfigs(
  body = {
    team_name,
    app_alias,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/plugins/${body.plugin_id}/configs`,
    {
      method: 'get',
      params: {
        build_version: body.build_version
      }
    }
  );
}

/*
   更新插件的配置信息
*/
export async function editPluginConfigs(
  body = {
    team_name,
    app_alias,
    plugin_id,
    data
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/plugins/${body.plugin_id}/configs`,
    {
      method: 'put',
      data: body.data
    }
  );
}

/* 查询应用的内存和磁盘使用情况 */
export async function getAppResource(
  body = { team_name, app_alias },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/resource`,
    {
      method: 'get',
      handleError
    }
  );
}

/*
   查询自定义二级域名后缀
*/
export async function getSubDomain(
  body = {
    team_name,
    service_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/sld-domain`,
    {
      method: 'get',
      params: {
        team_name: body.team_name,
        service_alias: body.service_alias
      }
    }
  );
}

/*
   修改二级域名
*/
export async function SubDomain(
  body = {
    team_name,
    service_alias,
    domain_name,
    container_port
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/sld-domain`,
    {
      method: 'put',
      data: {
        domain_name: body.domain_name,
        container_port: body.container_port
      }
    }
  );
}

/*
   查询可修改tcp端口
*/
export async function getSubPort(
  body = {
    team_name,
    service_alias,
    port
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/tcp-ports/${body.port}`,
    {
      method: 'get',
      params: {
        team_name: body.team_name,
        service_alias: body.service_alias,
        port: body.port
      }
    }
  );
}

/*
   修改端口
*/
export async function SubPort(
  body = {
    team_name,
    service_alias,
    port,
    lb_mapping_port,
    service_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/tcp-ports/${body.port}`,
    {
      method: 'put',
      data: {
        lb_mapping_port: body.lb_mapping_port,
        service_id: body.service_id
      }
    }
  );
}

/*
   修改自动构建API秘钥
*/
export async function putAutoDeploySecret(
  body = {
    team_name,
    service_alias,
    secret_key
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/webhooks/updatekey`,
    {
      method: 'put',
      data: {
        secret_key: body.secret_key
      }
    }
  );
}

/*
   修改自动构建命令
*/
export async function putAutoDeployCommand(
  body = {
    team_name,
    service_alias,
    keyword
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/keyword`,
    {
      method: 'put',
      data: {
        keyword: body.keyword
      }
    }
  );
}

/*
   修改镜像Tag触发值
*/
export async function putMirrorCommand(
  body = {
    team_name,
    service_alias,
    trigger
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/webhooks/trigger'`,
    {
      method: 'put',
      data: {
        tenantName: body.keyword,
        trigger: body.trigger,
        serviceAlias: body.service_alias
      }
    }
  );
}

/*
  获取应用镜像构建源信息
*/
export async function getMirrorCommand(
  body = {
    team_name,
    service_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/webhooks/get-url`,
    {
      method: 'get',
      params: {
        tenantName: body.team_name,
        serviceAlias: body.service_alias
      }
    }
  );
}

/*
  获取应用构建源信息
*/
export async function getAppBuidSource(
  body = {
    team_name,
    service_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/buildsource`,
    {
      method: 'get'
    }
  );
}

/*
  语言检测
*/
export async function getLanguage(
  body = {
    team_name,
    service_alias,
    check_uuid
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/check?check_uuid=${body.check_uuid}`,
    {
      method: 'get'
    }
  );
}

export async function putLanguage(
  body = {
    team_name,
    service_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/check`,
    {
      method: 'post',
      data: {
        is_again: true,
        event_id: body.eventId
      }
    }
  );
}

/*
  获取标签信息
*/
export async function getTagInformation(
  body = {
    team_name,
    app_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/labels/available`,
    {
      method: 'get'
    }
  );
}

/*
  修改应用构建源信息
*/
export async function putAppBuidSource(
  body = {
    team_name,
    service_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/buildsource`,
    {
      method: 'put',
      data: {
        service_source: body.service_source,
        git_url: body.git_url,
        code_version: body.code_version,
        image: body.image,
        cmd: body.cmd,
        user_name: body.user_name,
        password: body.password,
        is_oauth: body.is_oauth,
        service_id: body.oauth_service_id,
        full_name: body.full_name,
        server_type: body.server_type,
        arch: body.arch
      }
    }
  );
}

/** 更改应用状态 */
export async function updateComponentDeployType(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/deploytype`,
    {
      method: 'put',
      data: {
        extend_method: params.extend_method
      }
    }
  );
}

/** 修改服务名称 */
export async function updateServiceName(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/change/service_name`,
    {
      method: 'put',
      data: {
        service_name: params.service_name
      }
    }
  );
}

/** 修改应用状态 */
export async function changeApplicationState(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/set/is_upgrade`,
    {
      method: 'put',
      data: {
        build_upgrade: params.build_upgrade
      }
    }
  );
}

/** 修改应用状态 */
export async function getComponsentTrace(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/trace`,
    {
      method: 'get'
    }
  );
}

/** 修改应用状态 */
export async function setComponsentTrace(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/trace`,
    {
      method: 'post'
    }
  );
}

/** 修改应用状态 */
export async function deleteComponsentTrace(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/trace`,
    {
      method: 'delete'
    }
  );
}
// 获取App最新升级记录
export async function getAppLastUpgradeRecord(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.appID}/last-upgrade-record`,
    {
      method: 'get',
      noModels: body.noModels,
      showMessage: false
    }
  );
}
// 获取应用上次记录
export async function getAppModelLastRecord(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.appID}/last-upgrade-record`,
    {
      method: 'get',
      noModels: body.noModels,
      params: {
        record_type: body.record_type || 'upgrade',
        upgrade_group_id: body.upgrade_group_id
      },
      showMessage: false
    }
  );
}

/* 获取某个升级应用的详情，进入升级页面时调用 */
export async function getApplicationUpgradeDetail(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/apps/${body.upgradeGroupID}`,
    {
      method: 'get',
      params: {
        record_id: body.record_id,
        app_model_key: body.app_model_key
      },
      noModels: body.noModels,
      showMessage: false
    }
  );
}

/* 生成新的升级任务 */
export async function postUpgradeRecord(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.appID}/upgrade-records`,
    {
      method: 'post',
      data: {
        upgrade_group_id: body.upgrade_group_id
      },
      noModels: body.noModels,
      showMessage: false
    }
  );
}
/* 获取回滚记录列表 */
export async function getRollsBackRecordList(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/upgrade-records/${body.record_id}/rollback-records`,
    {
      method: 'get',
      noModels: body.noModels,
      showMessage: false
    }
  );
}
/* 获取回滚记录详情 */
export async function getRollsBackRecordDetails(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/upgrade-records/${body.record_id}`,
    {
      method: 'get',
      noModels: body.noModels,
      showMessage: false
    }
  );
}

/* 应用升级记录回滚 */
export async function rollbackUpgrade(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.appID}/upgrade-records/${body.record_id}/rollback`,
    {
      method: 'post',
      noModels: body.noModels,
      showMessage: false
    }
  );
}

/* 应用升级记录回滚列表 */
export async function rollbackUpgradeList(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.appID}/upgrade-records/${body.record_id}/rollback-records`,
    {
      method: 'get',
      noModels: body.noModels,
      showMessage: false
    }
  );
}
/* 获取运行策略数据 */
export async function getRunStrategy(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/job_strategy`,
    {
      method: 'get'
    }
  );
}
/* 添加运行策略数据 */
export async function addRunStrategy(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/job_strategy`,
    {
      method: 'put',
      data: {
        active_deadline_seconds: body.active_deadline_seconds,
        backoff_limit: body.backoff_limit,
        completions: body.completions,
        parallelism: body.parallelism,
        schedule: body.scheduleValue
      }
    }
  );
}
/* 添加Kubernetes属性 */
export async function addKubernetes(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/components/${body.service_alias}/k8s-attributes`,
    {
      method: 'post',
      data: {
        attribute: body.attribute
      }
    }
  );
}

/* 获取Kubernetes属性 */
export async function getKubernetes(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/components/${body.service_alias}/k8s-attributes`,
    {
      method: 'get'
    }
  );
}



// 修改Kubernetes属性
export async function editKubernetes(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/components/${body.service_alias}/k8s-attributes/${body.value_name}`,
    {
      method: 'put',
      data:{
        attribute: body.attribute
      }
    }
    
  );
}
// 删除Kubernetes属性
export async function deleteKubernetes(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/components/${body.service_alias}/k8s-attributes/${body.value_name}`,
    {
      method: 'delete'
    }
  );
}
// http://192.168.2.201:10000/console/teams/xzfn045k/apps/grdc46e7/pause
// vm虚拟机挂起恢复
export async function vmPause(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/${body.type}`,
    {
      method: 'post',
    }
  );
}



