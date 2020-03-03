import request from '../utils/request';
import apiconfig from '../../config/api.config';

/* 获取本地标签s（搜索） */
export async function fetchAppModelsTags(param) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/tag`,
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models/tag`,

    {
      method: 'get',
    }
  );
}

/* 添加本地标签 */
export async function createTag(param) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/tag`,
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models/tag`,

    {
      method: 'post',
      data: {
        name: param.name,
      },
    }
  );
}
/* 更新本地标签 */
export async function upDataTag(param) {
  return request(
    `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/tag/{tag_id}`,
    // `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models/tag/${param.tag_id}`,

    {
      method: 'PUT',
      data: {
        name: param.name,
      },
    }
  );
}

/* 删除本地标签 */
export async function deleteTag(param) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/{app_id}/tag`,
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models/${param.app_id}/tag`,

    {
      method: 'DELETE',
      data: {
        tag_id: param.tag_id,
      },
    }
  );
}

/* 获取本地应用列表（搜索） */
export async function fetchAppModels(param) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models`,
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/app-models`,
    {
      method: 'get',
      params: {
        page: param.page,
        page_size: param.page_size,
        scope: param.scope,
        app_name: param.app_name,
        is_complete: param.is_complete,
        tags:JSON.stringify(param.tags),
      },
    }
  );
}

/* 编辑本地应用 */
export async function upAppModel(body) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-model/{app_id}`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-model/${body.app_id}`,
    {
      method: 'PUT',
      data: {
        team_name: body.team_name,
        name: body.name,
        pic: body.pic,
        describe: body.describe,
        tag_ids: body.tag_ids,
        dev_status: body.dev_status ? body.dev_status : '',
        details: "This is a default description",
      },
    }
  );
}

/* 创建本地应用 */
export async function createAppModel(body) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models`,
    {
      method: 'post',
      data: {
        team_name: body.team_name,
        scope: body.scope,
        dev_status: body.dev_status ? body.dev_status : '',
        name: body.name,
        pic: body.pic,
        details: "This is a default description",
        describe: body.describe,
        tag_ids: body.tag_ids,
      },
    }
  );
}

/* 获取云端应用列表（搜索） */
export async function getMarketApp(param) {
  return request(
    // `http://doc.goodrain.org/mock/18/enterprise/{enterprise_id}/cloud/app-models`,
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/cloud/app-models`,
    {
      method: 'get',
      params: {
        page: param.page,
        page_size: param.page_size,
        open_query: param.open_query,
        app_name: param.app_name,
      },
    }
  );
}

/*
   应用导出状态查询
*/
export function queryExport(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/export`,
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/export`,

    {
      method: 'get',
      params: body.body,
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
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/export`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/export`,
    {
      method: 'post',
      data: {
        app_id: body.app_id,
        app_versions: body.app_versions,
        format: body.format,
      },
    }
  );
}

/*
     获取导出文件
  */
export async function getExport(body = { team_name, app_id, format }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/export/down?app_id=${body.app_id}&format=${body.format}`,
    {
      method: 'get',
    }
  );
}

/*
     应用包上传
  */
export function uploadApp(body = { team_name }) {
  const team_name = body.team_name;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/upload`,
    {
      method: 'post',
    }
  );
}

/*
     导入应用包
  */

export function importApp(
  body = {
    tenant_name,
    event_id,
    scope,
    file_name,
  }
) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/import/{event_id}`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import/${body.event_id}`,
    {
      method: 'post',
      data: {
        event_id: body.event_id,
        file_name: body.file_name,
        scope: body.scope,
        tenant_name: body.tenant_name,
      },
    }
  );
}

/*
     查询包导入状态
  */

export function queryImportApp(body = { team_name, event_id }) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/import/{event_id}`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import/${body.event_id}`,
    {
      method: 'get',
    }
  );
}

/*
     批量导入创建目录
  */

export function importDir(body = { team_name }) {
  const team_name = body.team_name;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/dir`,
    {
      method: 'post',
    }
  );
}

/*
     查询本次导入的目录下的文件
  */

export function queryImportDirApp(body = { enterprise_id, event_id }) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/{event_id}/dir`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import/${body.event_id}/dir`,
    {
      method: 'get',
      params: {
        event_id: body.event_id,
      },
    }
  );
}

/*
     查询导入中的文件
*/

export function queryImportingApp(body = { team_name }) {
  const team_name = body.team_name;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/importing-apps`,
    {
      method: 'get',
    }
  );
}

/*
  查询或创建导入应用流程记录
*/
export function queryImportRecord(body = { enterprise_id }) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/import`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import`,
    {
      method: 'post',
    }
  );
}

/*
  取消导入流程
*/
export function cancelImportApp(body = { enterprise_id, event_id }) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/app-models/import/{event_id}`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/app-models/import/${body.event_id}`,
    {
      method: 'delete',
    }
  );
}

/* 查询所有同步的应用 */
export async function getRecommendMarketAppList(
  body = {
    app_name,
    page,
    page_size,
    is_complete,
    enterprise_id
  }
) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/app-models/recommend`, {
    method: 'get',
    params: {
      app_name: body.app_name,
      page: body.page,
      page_size: body.page_size,
    },
  });
}


/* 获取企业开通的商店列表 */
export async function getStoreList(
  body = {
    enterprise_id
  }
) {
  return request(`${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/cloud/markets`, {
    method: 'get',
  });
}

/* 获取分享的应用模型列表 */
export async function getShareModelList(body) {
  return request(`${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.app_id}/shared/apps`, {
    method: 'get',
  });
}
