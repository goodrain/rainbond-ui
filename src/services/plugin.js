/* eslint-disable no-undef */
import apiconfig from '../../config/api.config';
import request from '../utils/request';

/* 安装内部市场的插件 */
export async function installMarketPlugin(body = { plugin_id }) {
  return request(`${apiconfig.baseUrl}/console/market/plugins/install`, {
    method: 'POST',
    data: body
  });
}

/* 获取内部市场可安装的插件 */
export async function getUnInstalledPlugin(
  body = { plugin_name, page, limit }
) {
  return request(`${apiconfig.baseUrl}/console/plugins/installable`, {
    method: 'get',
    params: body
  });
}

/*
查询发布单个任务的状态
 */
export async function startShareOneEvent(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugin-share/${body.shareId}/events/${body.eventId}`,
    {
      method: 'post'
    }
  );
}

/*
查询发布单个任务的状态
 */
export async function getShareOneEventInfo(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugin-share/${body.shareId}/events/${body.eventId}`,
    {
      method: 'get'
    }
  );
}

/*
  插件发布提交
*/
export async function getShareEventInfo(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugin-share/${body.shareId}/events`,
    {
      method: 'get'
    }
  );
}

/*
  插件发布提交
*/
export async function submitSharePlugin(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugin-share/${body.shareId}`,
    {
      method: 'post',
      data: {
        share_plugin_info: body.share_plugin_info
      }
    }
  );
}

/**
  获取插件发布的信息
 */
export async function getPluginShareInfo(
  body = {
    team_name,
    pluginId,
    shareId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugin-share/${body.shareId}`,
    {
      method: 'get'
    }
  );
}

/**
  放弃发布插件
 */
export async function giveupSharePlugin(
  body = {
    team_name,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugin-share/${body.share_id}`,
    {
      method: 'delete'
    }
  );
}

/**
  发布插件
 */
export async function sharePlugin(
  body = {
    team_name,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/share/record`,
    {
      method: 'post'
    }
  );
}

/*
  查询未完成插件发布记录
 */
export async function getShareRecord(
  body = {
    team_name,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/share/record`,
    {
      method: 'get'
    }
  );
}

/*
	获取应用的历史操作日志
*/
export async function getMyPlugins(
  body = {
    team_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/all`,
    { method: 'get' }
  );
}

/*
	创建插件
*/
export async function createPlugin(
  body = {
    team_name,
    plugin_alias,
    build_source,
    min_memory,
    category,
    image,
    code_repo,
    code_version,
    desc
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins`,
    {
      method: 'post',
      data: body
    }
  );
}

/*
	删除插件
*/
export async function deletePlugin(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}`,
    {
      method: 'delete',
      data: {
        is_force: body.is_force
      },
      handleError
    }
  );
}

/*
	获取插件基础信息
*/
export async function getPluginInfo(
  body = {
    team_name,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}`,
    { method: 'get' }
  );
}

/*
	获取插件版本信息
*/

export async function getPluginVersions(
  body = {
    team_name,
    plugin_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/build-history`,
    {
      method: 'get',
      params: {
        page: 1,
        page_size: 100
      }
    }
  );
}

/*
	获取某个版本的基本信息
*/

export async function getPluginVersionInfo(
  body = {
    team_name,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}`,
    {
      method: 'get',
      showLoading: false
    }
  );
}

/*
	获取某个版本的配置信息
*/

export async function getPluginVersionConfig(
  body = {
    team_name,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}/config`,
    { method: 'get' }
  );
}

/*
  更新某个版本的基本信息
*/
export async function editPluginVersionInfo(
  body = {
    team_name,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}`,
    {
      method: 'put',
      data: body
    }
  );
}

/*
  添加配置信息
*/
export async function addPluginVersionConfig(body) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}/config`,
    {
      method: 'post',
      data: body.entry
    }
  );
}

/*
  删除配置信息
*/
export async function removePluginVersionConfig(
  body = {
    team_name,
    plugin_id,
    build_version,
    config_group_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}/config`,
    {
      method: 'delete',
      data: {
        config_group_id: body.config_group_id,
        config_name: body.config_name
      }
    }
  );
}

/*
  删除配置信息
*/
export async function editPluginVersionConfig(
  body = {
    team_name,
    plugin_id,
    build_version,
    entry
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}/config`,
    {
      method: 'put',
      data: body.entry
    }
  );
}

/*
  删除版本
*/
export async function removePluginVersion(
  body = {
    team_name,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}`,
    { method: 'delete' }
  );
}

/*
  创建新版本
*/
export async function createPluginVersion(
  body = {
    team_name,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/new-version`,
    { method: 'post' }
  );
}
/*
  创建新版本
*/
export async function buildPluginVersion(
  body = {
    team_name,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}/build`,
    { method: 'post' }
  );
}

/*
  构建版本
*/
export async function getBuildPluginVersionStatus(
  body = {
    team_name,
    plugin_id,
    build_version
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}/status`,
    { method: 'get' }
  );
}

/*
    版本构建日志
*/
export async function getBuildVersionLog(
  body = {
    team_name,
    plugin_id,
    build_version,
    level
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/version/${body.build_version}/event-log`,
    {
      method: 'get',
      params: {
        level: body.level
      }
    }
  );
}

/*
  获取已安装某个插件的所有应用
*/
export async function getUsedApp(
  body = {
    team_name,
    plugin_id,
    page,
    page_size
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/${body.plugin_id}/used_services`,
    {
      method: 'get',
      params: {
        page: body.page,
        page_size: body.page_size
      }
    }
  );
}

/*
   临时接口，查询默认安装的插件
 */
export async function getDefaultPlugin(body = { team_name }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/default`,
    { method: 'get' }
  );
}

/*
   安装默认插件
 */
export async function installDefaultPlugin(body = { team_name, plugin_type }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/plugins/default`,
    {
      method: 'post',
      data: {
        plugin_type: body.plugin_type
      }
    }
  );
}
