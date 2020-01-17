import request from "../utils/request";
import apiconfig from '../../config/api.config';

/*
   获取云市应用
*/
export function getMarketApp(body = {}) {
  return request(`${apiconfig.baseUrl}/console/apps`, {
    method: "get",
    params: body
  });
}

/*
   应用导出状态查询
*/
export function queryExport(body = { team_name, body,app_id }) {
  const team_name = body.team_name;
  return request(`${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/export`, {
    method: "get",
    params: body.body,
  });
}

/*
     应用导出 console/teams/{team_name}/apps/export
  */
  export function appExport(body = { team_name, app_id, format,group_version }) {
  const team_name = body.team_name;
  return request(`${apiconfig.baseUrl}/console/teams/${team_name}/apps/export`, {
    method: "post",
    data: {
      app_id: body.app_id,
      group_key: body.group_key,
      group_version: body.group_version,
      format: body.format
    }
  });
}

/*
     获取导出文件
  */
export async function getExport(body = { team_name, app_id, format }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${
      body.team_name
    }/apps/export/down?app_id=${body.app_id}&format=${body.format}`,
    {
      method: "get"
    }
  );
}

/*
     应用包上传
  */
export function uploadApp(body = { team_name }) {
  const team_name = body.team_name;
  return request(`${apiconfig.baseUrl}/console/teams/${team_name}/apps/upload`, {
    method: "post"
  });
}

/*
     导入应用包
  */

export function importApp(
  body = {
    team_name,
    event_id,
    scope,
    file_name
  }
) {
  const team_name = body.team_name;
  const event_id = body.event_id;
  return request(
    `${apiconfig.baseUrl}/console/teams/${team_name}/apps/import/${event_id}`,
    {
      method: "post",
      data: {
        event_id: body.event_id,
        file_name: body.file_name,
        scope: body.scope
      }
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
      method: "get"
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
      method: "post"
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
      method: "get",
      params: {
        event_id: body.event_id
      }
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
      method: "get"
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
      method: "post"
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
      method: "delete",
    }
  );
}

/* 查询所有同步的应用 */
export async function getRecommendMarketAppList(body = {
  app_name,
  page,
  page_size,
  is_complete,
}) {
  return request(`${apiconfig.baseUrl}/console/app_market/recommend/apps`, {
    method: "get",
    params: {
      app_name: body.app_name,
      page: body.page,
      page_size: body.page_size,
    },
  });
}