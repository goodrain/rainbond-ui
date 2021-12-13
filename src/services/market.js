/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
/* eslint-disable camelcase */
import apiconfig from '../../config/api.config';
import request from '../utils/request';

/* 获取本地标签s（搜索） */
export async function fetchAppModelsTags(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models/tag`,

    {
      method: 'get'
    }
  );
}
export async function getAppModelsDetails(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-model/${param.appId}`,

    {
      method: 'get',
      params: param
    }
  );
}
export async function upDataAppVersionInfo(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-model/${param.appId}/version/${param.version}`,
    {
      method: 'put',
      data: param
    }
  );
}
export async function delAppVersion(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-model/${param.appId}/version/${param.version}`,
    {
      method: 'DELETE'
    }
  );
}
export async function fetchMarkets(params = {}) {
  const { enterprise_id, name, pageSize, page, query } = params;
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${enterprise_id}/cloud/markets/${name}/app-models`,
    {
      method: 'get',
      params: {
        page_size: pageSize,
        page,
        query
      }
    }
  );
}
export async function fetchMarketsTab(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/cloud/markets`,
    {
      method: 'get',
      params: {
        extend: true
      }
    }
  );
}
export async function fetchHelmMarketsTab(param) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${param.enterprise_id}/appstores`,
    {
      method: 'get'
    }
  );
}
export async function fetchHelmMarkets(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/helm/${param.repo_name}/apps`,
    {
      method: 'get'
    }
  );
}
export async function fetchOrganizations(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/cloud/markets/${param.market_id}/organizations`,
    {
      method: 'get',
      showMessage: false
    }
  );
}
/* 添加本地标签 */
export async function createTag(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models/tag`,

    {
      method: 'post',
      data: {
        name: param.name
      }
    }
  );
}
/* 更新本地标签 */
export async function upDataTag(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models/tag/${param.tag_id}`,
    {
      method: 'PUT',
      data: {
        name: param.name
      }
    }
  );
}

/* 删除本地标签 */
export async function deleteTag(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models/${param.app_id}/tag`,

    {
      method: 'DELETE',
      data: {
        tag_id: param.tag_id
      }
    }
  );
}

/* 获取本地应用列表（搜索） */
export async function fetchAppModels(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models`,
    {
      method: 'get',
      params: {
        page: param.page,
        page_size: param.page_size,
        scope: param.scope,
        app_name: param.app_name,
        is_complete: param.is_complete,
        tags: JSON.stringify(param.tags),
        need_install: param.need_install
      }
    }
  );
}

/* 编辑本地应用 */
export async function upAppModel(body) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-model/${body.app_id}`,
    {
      method: 'PUT',
      data: {
        scope: body.scope,
        create_team: body.create_team,
        team_name: body.team_name,
        name: body.name,
        pic: body.pic,
        describe: body.describe,
        tag_ids: body.tag_ids,
        details: body.details || 'This is a default description'
      }
    }
  );
}

/* delete  App  Market */
export async function deleteAppMarket(body) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/markets/${body.marketName}`,
    {
      method: 'DELETE'
    }
  );
}

export async function deleteHelmAppStore(body) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/appstores/${body.name}`,
    {
      method: 'DELETE'
    }
  );
}
/* up  App  Market */
export async function upAppMarket(body) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/markets/${body.marketName}`,
    {
      method: 'PUT',
      data: body
    }
  );
}

export async function upHelmAppStore(body) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/appstores/${body.name}`,
    {
      method: 'PUT',
      data: body
    }
  );
}
export async function CheckWarehouseAppName(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/appstores/${body.name}`,
    {
      method: 'get',
      handleError,
      params: {
        name: body.name
      }
    }
  );
}

/* get  App  Market Info */
export async function getAppMarketInfo(body) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/markets/${body.name}`,
    {
      method: 'get'
    }
  );
}
/* get  Binding  Markets */
export async function postBindingMarkets(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/bind-markets`,
    {
      method: 'post',
      handleError,
      data: body
    }
  );
}

/* get  Binding  Market List */
export async function getBindingMarketsList(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/bindable-markets`,
    {
      method: 'get',
      handleError,
      params: body
    }
  );
}
export async function getHelmAppStore(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/appstores/${body.name}/apps`,
    {
      method: 'get',
      handleError,
      params: body
    }
  );
}
// 同步Helm应用列表
export async function syncHelmAppStore(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/appstores/${body.name}/resync`,
    {
      method: 'POST',
      handleError
    }
  );
}
export async function postHelmAppStore(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/appstores`,
    {
      method: 'post',
      data: body,
      handleError
    }
  );
}

/* create  App  Market */
export async function createAppMarket(body) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/markets`,
    {
      method: 'post',
      data: body
    }
  );
}

/* 创建本地应用 */
export async function createAppModel(body) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models`,
    {
      method: 'post',
      data: {
        source: body.source,
        create_team: body.create_team,
        team_name: body.team_name,
        scope: body.scope,
        scope_target: body.scope_target,
        dev_status: body.dev_status ? body.dev_status : '',
        name: body.name,
        pic: body.pic,
        details: 'This is a default description',
        describe: body.describe,
        tag_ids: body.tag_ids
      }
    }
  );
}
/* 创建市场应用 */
export async function createMarketAppModel(data) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${data.enterprise_id}/cloud/markets/${data.marketName}/app-models`,
    {
      method: 'post',
      data
    }
  );
}

/* 获取云端应用列表（搜索） */
export async function getMarketApp(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/cloud/app-models`,
    {
      method: 'get',
      params: {
        page: param.page,
        page_size: param.page_size,
        open_query: param.open_query,
        app_name: param.app_name
      }
    }
  );
}

/*
   应用导出状态查询
*/
export function queryExport(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/export`,

    {
      method: 'get',
      params: body.body
    }
  );
}

/*
     应用导出 console/teams/{team_name}/apps/export
  */
export function appExport(
  body = { enterprise_id, app_id, format, app_versions }
) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/export`,
    {
      method: 'post',
      data: {
        app_id: body.app_id,
        app_versions: body.app_versions,
        format: body.format
      }
    }
  );
}

/*
     导入应用包
  */

export function importApp(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import/${body.event_id}`,
    {
      method: 'post',
      data: {
        event_id: body.event_id,
        file_name: body.file_name,
        scope: body.scope,
        tenant_name: body.tenant_name
      }
    }
  );
}

/*
     查询包导入状态
  */

export function queryImportApp(body = { team_name, event_id }, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import/${body.event_id}`,
    {
      method: 'get',
      handleError
    }
  );
}

/*
     批量导入创建目录
  */

export function importDir(body = { team_name }) {
  const { team_name } = body;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/dir`,
    {
      method: 'post'
    }
  );
}

/*
     查询本次导入的目录下的文件
  */

export function queryImportDirApp(
  body = { enterprise_id, event_id },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import/${body.event_id}/dir`,
    {
      method: 'get',
      params: {
        event_id: body.event_id
      },
      handleError
    }
  );
}

/*
     查询导入中的文件
*/

export function queryImportingApp(body = { team_name }) {
  const { team_name } = body;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/importing-apps`,
    {
      method: 'get'
    }
  );
}

/*
  查询或创建导入应用流程记录
*/
export function queryImportRecord(body = { enterprise_id }) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import`,
    {
      method: 'post'
    }
  );
}

/*
  取消导入流程
*/
export function cancelImportApp(body = { enterprise_id, event_id }) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import/${body.event_id}`,
    {
      method: 'delete'
    }
  );
}

/* 查询所有同步的应用 */
export async function getRecommendMarketAppList(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/app-models/recommend`,
    {
      method: 'get',
      params: {
        app_name: body.app_name,
        page: body.page,
        page_size: body.page_size
      }
    }
  );
}

/* 获取企业开通的商店列表 */
export async function getStoreList(
  body = {
    enterprise_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/markets`,
    {
      method: 'get',
      params: {
        extend: true
      }
    }
  );
}

/* 获取发布的应用模型列表 */
export async function getShareModelList(body) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/shared/apps`,
    {
      method: 'get',
      params: {
        scope: body.scope,
        market_id: body.market_id
      }
    }
  );
}

export async function storehubCheck(body) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.eid}/storehub-check`,
    {
      method: 'get'
    }
  );
}
