/* eslint-disable camelcase */
/* eslint-disable no-undef */
import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getServiceNameList(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/groups/${params.group_id}/k8sservices`
  );
}
export async function CheckAppName(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/check-resource-name`,
    {
      method: 'post',
      handleError,
      data: {
        name: params.app_name,
        type: 'helmApp',
        region_name: params.regionName
      }
    }
  );
}

export async function getAssociatedComponents(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/groups/${params.groupId}/components`,
    {
      method: 'get',
      params: {
        service_name: params.service_name
      }
    }
  );
}
export async function getHelmComponents(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/groups/${params.groupId}/helmapp-components`,
    {
      method: 'get'
    }
  );
}

export async function getAppAccess(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/groups/${params.groupId}/visit`,
    {
      method: 'get'
    }
  );
}
export async function createAppBatchComponents(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/groups/${params.groupId}/batch-components`,
    {
      method: 'post',
      data: params.data
    }
  );
}

export async function CheckHelmApp(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/detect-process`,
    {
      method: 'get',
      params: body
    }
  );
}
export async function Toupgrade(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/groups/${params.group_id}/upgradable_num`,
    {
      method: 'get'
    }
  );
}
export async function CheckK8sServiceName(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/checkK8sServiceName`,
    {
      method: 'post',
      data: {
        k8s_service_name: params.k8s_service_name
      }
    }
  );
}

export async function SetCheckK8sServiceName(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/groups/${params.group_id}/k8sservices`,
    {
      method: 'put',
      data: params.arr
    }
  );
}
export async function setGovernancemode(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.tenantName}/groups/${params.group_id}/governancemode`,
    {
      method: 'put',
      data: {
        governance_mode: params.governance_mode
      }
    }
  );
}

/*
   查询备份状态
*/
export async function getBackupStatus(
  body = { team_name, backup_id, group_id }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/backup`,
    {
      method: 'get',
      params: {
        backup_id: body.backup_id
      }
    }
  );
}

/*
   查询备份
*/
export async function getBackup(body = { team_name, group_id }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groupapp/backup`,
    {
      method: 'get',
      params: {
        group_id: body.group_id,
        page: body.page,
        page_size: body.page_size
      }
    }
  );
}

/**
 * 查询全部备份
 */

export async function queryAllBackup(param) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${param.team_name}/all/groupapp/backup`,
    {
      method: 'get',
      params: {
        page: param.pageNum || 1,
        page_size: param.pageSize || 10
      }
    }
  );
}

export async function queryRestoreState(param) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${param.team_name}/groupapp/${param.group_id}/migrate/record`,
    {
      method: 'get',
      params: {
        group_uuid: param.group_uuid
      }
    }
  );
}
/*
   备份
*/
export async function backup(body = { team_name, group_id }, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/backup`,
    {
      method: 'POST',
      data: {
        note: body.note,
        mode: body.mode,
        force: body.force
      },
      handleError
    }
  );
}

/*
  查询这个组的所有可监控应用的响应时间和吞吐率
*/
export async function groupMonitorData(
  body = { team_name, group_id },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/monitor/batch_query`,
    {
      method: 'get',
      showLoading: false,
      showMessage: false,
      handleError
    }
  );
}

/*
	应用未创建阶段的信息修改
	可部分修改
*/

export async function editAppCreateCompose(
  body = {
    team_name,
    group_id,
    group_name,
    compose_content
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/compose_update`,
    {
      method: 'put',
      data: body
    }
  );
}

/*
	获取某个应用组的信息
*/
export async function getGroupDetail(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}`,
    {
      handleError
    }
  );
}

export async function getHelmAppStoresVersions(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/appstores/${body.appStoreName}/templates/${body.templateName}/versions/${body.version}`,
    {
      handleError
    }
  );
}

export async function getUpgradeComponentList(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/apps/${body.upgrade_group_id}/components`,
    {
      params: { app_model_key: body.app_model_key },
      handleError
    }
  );
}

/*
	获取某个应用组的信息
*/
export async function getAppDetailState(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/status`
  );
}
/*
	获取某个应用组的信息
*/
export async function getAppResourcesStatistics(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/group/${body.group_id}/resources`
  );
}

/*
	获取某个应用组的应用列表
*/
export async function getGroupApps(
  body = {
    team_name,
    region_name,
    group_id,
    page,
    page_size,
    sort,
    order
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/service/group`,
    {
      method: 'get',
      params: {
        group_id: body.group_id,
        page: body.page || 1,
        page_size: body.page_size || 100,
        query: body.query,
        sort: body.sort,
        order: body.order
      },
      showLoading: false
    }
  );
}

/*
  删除组
*/
export async function deleteGroup(
  body = {
    team_name,
    group_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}`,
    {
      method: 'delete'
    }
  );
}

/*
  放弃compose创建的应用， 只用在创建未完成阶段
*/
export async function deleteCompose(
  body = {
    team_name,
    group_id,
    compose_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/delete`,
    {
      method: 'delete',
      data: {
        compose_id: body.compose_id
      }
    }
  );
}

/*
  修改组
*/
export async function editGroup(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}`,
    {
      method: 'put',
      data: {
        app_name: body.group_name,
        note: body.note,
        username: body.username,
        logo: body.logo,
        k8s_app: body.k8s_app
      }
    }
  );
}

export async function editGroups(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/volumes`,
    {
      method: 'put',
    }
  );
}

/*
  组
*/
export async function addGroup(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups`,
    {
      method: 'post',
      params: {
        region_name: body.region_name
      },
      data: {
        team_name: body.team_name,
        region_name: body.region_name,
        app_name: body.group_name,
        note: body.note,
        logo: body.logo,
        k8s_app: body.k8s_app
      },
      showMessage: body.showMessage,
      noModels: body.noModels
    }
  );
}


export async function getServices(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/services`,
    {
      method: 'get',
      handleError
    }
  );
}

/*
  获取复制应用组件列表信息
*/
export async function queryCopyComponent(body = {}) {
  const { tenantName, group_id } = body;
  return request(
    `${apiconfig.baseUrl}/console/teams/${tenantName}/groupapp/${group_id}/copy`,
    {
      method: 'get',
      data: {
        tenantName,
        group_id
      }
    }
  );
}

/*
  添加复制应用
*/
export async function AddCopyTeamApps(body = {}, handleError) {
  const { tenantName, group_id } = body;
  return request(
    `${apiconfig.baseUrl}/console/teams/${tenantName}/groupapp/${group_id}/copy`,
    {
      handleError,
      method: 'post',
      data: body
    }
  );
}

/*
	查询未完成发布记录
*/
export async function recordShare(
  body = {
    team_name,
    group_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/share/record`,
    {
      method: 'get',
      params: {
        team_name: body.team_name,
        group_id: body.group_id
      }
    }
  );
}

/*
	创建发布记录
*/
export async function createShare(
  body = {
    team_name,
    group_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/share/record`,
    {
      method: 'post',
      data: {
        group_id: body.group_id,
        scope: body.scope,
        target: body.target
      }
    }
  );
}
// 获取发布记录
export async function getShareRecords(
  body = {
    team_name,
    app_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/share/record`,
    {
      method: 'get',
      params: {
        page: body.page,
        page_size: body.page_size
      }
    }
  );
}

// 获取指定发布记录
export async function getShareRecord(
  body = {
    team_name,
    app_id,
    record_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/share/record/${body.record_id}`,
    {
      method: 'get'
    }
  );
}

// 获取指定发布记录
export async function deleteShareRecord(
  body = {
    team_name,
    app_id,
    record_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/share/record/${body.record_id}`,
    {
      method: 'delete'
    }
  );
}

/*
	放弃发布
*/
export async function giveupShare(
  body = {
    team_name,
    share_id
  },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/giveup`,
    { method: 'delete', handleError }
  );
}

/*
	查询需要发布应用信息和插件信息
*/
export async function getShare(
  body = {
    team_name,
    shareId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.shareId}/info`,
    {
      method: 'get'
    }
  );
}

/*
	提交发布信息
*/
export async function submitShare(
  body = {
    team_name,
    share_id,
    new_info,
    use_force
  },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/info`,
    {
      method: 'post',
      data: body.new_info,
      handleError,
      params: {
        use_force: body.use_force,
        is_plugin: body.new_info.app_version_info.is_plugin
      }
    }
  );
}

/*
  构建compose应用
*/
export async function buildCompose(
  body = {
    team_name,
    group_id,
    compose_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/compose_build`,
    {
      method: 'post',
      data: {
        compose_id: body.compose_id
      }
    }
  );
}

/*
   获取发布应用的事件信息
*/
export async function getShareEventInfo(
  body = {
    team_name,
    share_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events`,
    { method: 'get' }
  );
}

/*
    执行发布事件
*/
export async function startShareEvent(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events/${body.event_id}`,
    { method: 'post' }
  );
}

/*
    执行发布插件事件，在应用发布时
*/
export async function startPluginShareEventInShareApp(
  body = {
    team_name,
    share_id,
    event_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events/${body.event_id}/plugin`,
    { method: 'post' }
  );
}

/*
    查询发布插件事件，在应用发布时
*/
export async function getPluginShareEventInShareApp(
  body = {
    team_name,
    share_id,
    event_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events/${body.event_id}/plugin`,
    { method: 'get' }
  );
}

/*
    查询发布状态
*/
export async function getShareStatus(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events/${body.event_id}`,
    { method: 'get' }
  );
}

/*
    完成发布
*/
export async function completeShare(
  body = {
    team_name,
    share_id,
    event_id
  },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/complete`,
    { 
      method: 'post',
      params: {
        is_plugin: body.is_plugin
      },
      handleError 
    }
  );
}

export async function InstallHelmApp(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/install`,
    {
      method: 'post',
      data: {
        overrides: body.overrides,
        values: body.values
      },
      handleError
    }
  );
}

export async function parseChart(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/parse-helm-app`,
    {
      method: 'post',
      data: {
        version: body.version
      }
    }
  );
}

export async function EditHelmApp(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}`,
    {
      method: 'put',
      data: {
        username: body.username,
        app_name: body.app_name,
        app_note: body.app_note,
        overrides: body.overrides,
        values: body.values,
        version: body.version,
        revision: body.revision
      }
    }
  );
}

export async function AddAssociatedComponents(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/components`,
    {
      method: 'post',
      data: {
        service_name: body.service_name,
        port: body.port
      }
    }
  );
}

/*
  应用备份迁移/恢复
*/
export async function migrateApp(
  body = {
    team_name,
    region,
    team,
    backup_id,
    group_id,
    migrate_type,
    event_id,
    notRecovered_restore_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/migrate`,
    {
      method: 'post',
      data: {
        region: body.region,
        team: body.team,
        backup_id: body.backup_id,
        migrate_type: body.migrate_type,
        event_id: body.event_id,
        restore_id: body.notRecovered_restore_id
      }
    }
  );
}

/*
  应用备份迁移／恢复状态查询
*/
export async function queryMigrateApp(
  body = { team_name, restore_id, group_id }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/migrate`,
    {
      method: 'get',
      params: {
        restore_id: body.restore_id
      }
    }
  );
}

/*
  应用备份恢复删除
*/
export async function delRestore(body = { team_name, group_id, new_group_id }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/delete`,
    {
      method: 'DELETE',
      data: {
        new_group_id: body.new_group_id
      }
    }
  );
}

/*
  应用备份删除
*/
export async function delBackup(body = { team_name, group_id, backup_id }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/backup`,
    {
      method: 'DELETE',
      data: {
        backup_id: body.backup_id
      }
    }
  );
}

/*
应用失败记录删除
*/
export async function delFailureBackup(
  body = { team_name, group_id, backup_id }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/backup`,
    {
      method: 'DELETE',
      data: {
        backup_id: body.backup_id
      }
    }
  );
}
// 检查治理模式
export async function checkoutGovernanceModel(
  body = { team_name, app_id, governance_mode },
  handleError
) {
  return request(
    `/console/teams/${body.team_name}/groups/${body.app_id}/governancemode/check`,
    {
      method: 'GET',
      params: {
        governance_mode: body.governance_mode
      },
      handleError
    }
  );
}

// 应用下所有k8s资源获取
export async function getKubernetesVal(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/k8s-resources`,
    {
      method: 'get',
    }
  );
}
// 应用下单个k8s资源获取
export async function getSingleKubernetesVal(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/k8s-resources/${body.list_name}`,
    {
      method: 'get',
      params: {
        list_name: body.list_name,
        id:body.id
      },
    }
  );
}

// 应用下新增单个k8s资源
export async function addSingleKubernetesVal(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/k8s-resources`,
    {
      method: 'post',
      data: {
        resource_yaml:body.yaml
      },
    }
  );
}
// 应用下删除单个k8s资源
export async function delSingleKubernetesVal(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/k8s-resources/${body.list_name}`,
    {
      method: 'DELETE',
      data: {
        resource_yaml:body.yaml,
        id:body.List_id,
      },
    }
  );
}
// 应用下修改单个k8s资源
export async function editSingleKubernetesVal(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/k8s-resources/${body.list_name}`,
    {
      method: 'put',
      data: {
        resource_yaml:body.yaml,
        id:body.List_id,
      },
    }
  );
}
// 安装helm应用-添加helm应用模版
export function addHelmModule(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/helm_center_app`,
    {
      method: 'post',
      data: {
        repo_name: body.repo_name,
        chart_name: body.chart_name,
        pic: body.pic || '',
        describe: body.describe || '',
        details: body.details || ''
      },
      handleError
    }
  );
}
// 安装helm应用-生成helm应用模版
export function generateHelmModule(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/helm_app`,
    {
      method: 'post',
      data: {
        name:body.name,
        repo_name: body.repo_name,
        chart_name: body.chart_name,
        version: body.version,
        overrides: body.overrides,
        app_model_id: body.app_model_id,
        app_id: body.app_id
      },
      handleError
    }
  );
}