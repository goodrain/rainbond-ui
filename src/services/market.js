import request from '../utils/request';
import apiconfig from '../../config/api.config';

/* 获取本地标签s（搜索） */
export async function fetchComponentTags(param) {
  return request(
    // `http://proxy.goodrain.com:23701/console/apps/tag`,
    `/console/enterprise/{enterprise_id}/market/local/apps/tag`,
    // `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/market/local/apps/tag`,

    {
      method: 'get',
    }
  );
}


/* 获取本地应用列表（搜索） */
export async function fetchComponent(param) {
  return request(
    `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/market/local/apps`,
    // `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/market/local/apps`,
    {
      method: 'get',
      params: {
        page: param.page,
        page_size: param.page_size,
        scope: param.scope,
        app_name: param.app_name,
        tags: param.tags,
      },
    }
  );
}


/* 获取云端应用列表（搜索） */
export async function getMarketApp(param) {
  return request(
    `http://doc.goodrain.org/mock/18/enterprise/{enterprise_id}/market/cloud/apps`,
    // `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/market/cloud/apps`,

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
    // `${apiconfig.baseUrl}/console/enterprise/${enterprise_id}/market/apps/export`,
    `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/market/apps/export`,
    // `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/export`,

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
    `http://doc.goodrain.org/mock/18/console/enterprise/{enterprise_id}/market/apps/export`,
    // `${apiconfig.baseUrl}/console/enterprise/${enterprise_id}/market/apps/export`,
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
    team_name,
    event_id,
    scope,
    file_name,
  }
) {
  const team_name = body.team_name;
  const event_id = body.event_id;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/${event_id}`,
    {
      method: 'post',
      data: {
        event_id: body.event_id,
        file_name: body.file_name,
        scope: body.scope,
      },
    }
  );
}

/*
     查询包导入状态
  */

export function queryImportApp(body = { team_name, event_id }) {
  const team_name = body.team_name;
  const event_id = body.event_id;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/${event_id}`,
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

export function queryImportDirApp(body = { team_name, event_id }) {
  const team_name = body.team_name;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/dir`,
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
export function queryImportRecord(body = { team_name }) {
  const team_name = body.team_name;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/record`,
    {
      method: 'post',
    }
  );
}

/*
  取消导入流程
*/
export function cancelImportApp(body = { team_name, event_id }) {
  const team_name = body.team_name;
  const event_id = body.event_id;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/${event_id}`,
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
  }
) {
  return request(`${apiconfig.baseUrl}/console/app_market/recommend/apps`, {
    method: 'get',
    params: {
      app_name: body.app_name,
      page: body.page,
      page_size: body.page_size,
    },
  });
}
