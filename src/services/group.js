import request from "../utils/request";
import config from "../config/config";

/*
   查询备份状态
*/
export async function getBackupStatus(body = { team_name, backup_id, group_id }) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/backup`,
    {
      method: "get",
      params: {
        backup_id: body.backup_id,
      },
    },
  );
}

/*
   查询备份
*/
export async function getBackup(body = { team_name, group_id }) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/groupapp/backup`, {
    method: "get",
    params: {
      group_id: body.group_id,
      page: body.page,
      page_size: body.page_size,
    },
  });
}

/**
 * 查询全部备份
 */

export async function queryAllBackup(param) {
  return request(`${config.baseUrl}/console/teams/${param.team_name}/all/groupapp/backup`, {
    method: "get",
    params: {
      page: param.pageNum || 1,
      page_size: param.pageSize || 10,
    },
  });
}

export async function queryRestoreState(param) {
  return request(`${config.baseUrl}/console/teams/${param.team_name}/groupapp/${param.group_id}/migrate/record`, {
    method: "get",
    params: {
      group_uuid: param.group_uuid
    }
  });
}
/*
   备份
*/
export async function backup(body = { team_name, group_id }) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/backup`,
    {
      method: "POST",
      data: {
        note: body.note,
        mode: body.mode,
      },
    },
  );
}

/*
  查询这个组的所有可监控应用的响应时间和吞吐率
*/
export async function groupMonitorData(body = { team_name, group_id }) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/monitor/batch_query`,
    {
      method: "get",
      showLoading: false,
      showMessage: false,
    },
  );
}

/*
	应用未创建阶段的信息修改
	可部分修改
*/

export async function editAppCreateCompose(body = {
  team_name,
  group_id,
  group_name,
  compose_content,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/compose_update`,
    {
      method: "put",
      data: body,
    },
  );
}

/*
	获取某个应用组的信息
*/
export async function getGroupDetail(
  body = {
    team_name,
    group_id,
  },
  handleError,
) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}`, {
    handleError,
  });
}

/*
	获取某个应用组的应用列表
*/
export async function getGroupApps(body = {
  team_name,
  region_name,
  group_id,
  page,
  page_size,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/service/group`, {
    method: "get",
    params: {
      group_id: body.group_id,
      page: body.page || 1,
      page_size: body.page_size || 100,
    },
    showLoading: false,
  });
}

/*
  删除组
*/
export async function deleteGroup(body = {
  team_name,
  group_id,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}`, {
    method: "delete",
  });
}

/*
  放弃compose创建的应用， 只用在创建未完成阶段
*/
export async function deleteCompose(body = {
  team_name,
  group_id,
  compose_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/delete`,
    {
      method: "delete",
      data: {
        compose_id: body.compose_id,
      },
    },
  );
}

/*
  修改组
*/
export async function editGroup(body = {
  team_name,
  group_id,
  group_name,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}`, {
    method: "put",
    data: {
      group_name: body.group_name,
    },
  });
}

/*
  组
*/
export async function addGroup(body = {
  team_name,
  group_name,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/groups`, {
    method: "post",
    data: {
      group_name: body.group_name,
    },
  });
}

/*
	查询未完成分享记录
*/
export async function recordShare(body = {
  team_name,
  group_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/share/record`,
    {
      method: "get",
      params: {
        team_name: body.team_name,
        group_id: body.group_id,
      },
    },
  );
}

/*
	验证是否可以分享
*/
export async function checkShare(body = {
  team_name,
  group_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/share/record`,
    {
      method: "post",
      data: {
        group_id: body.group_id,
      },
    },
  );
}

/*
	放弃分享
*/
export async function giveupShare(body = {
  team_name,
  share_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/giveup`,
    { method: "delete" },
  );
}

/*
	查询需要分享应用信息和插件信息
*/
export async function getShare(body = {
  team_name,
  shareId,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/share/${body.shareId}/info`, {
    method: "get",
  });
}

/*
	提交分享信息
*/
export async function submitShare(body = {
  team_name,
  share_id,
  new_info,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/info`, {
    method: "post",
    data: body.new_info,
  });
}

/*
  构建compose应用
*/
export async function buildCompose(body = {
  team_name,
  group_id,
  compose_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/compose_build`,
    {
      method: "post",
      data: {
        compose_id: body.compose_id,
      },
    },
  );
}

/*
   获取分享应用的事件信息
*/
export async function getShareEventInfo(body = {
  team_name,
  share_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events`,
    { method: "get" },
  );
}

/*
    执行分享事件
*/
export async function startShareEvent(body = {
  team_name,
  share_id,
  event_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events/${
    body.event_id
    }`,
    { method: "post" },
  );
}

/*
    执行分享插件事件，在应用分享时
*/
export async function startPluginShareEventInShareApp(body = {
  team_name,
  share_id,
  event_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events/${
    body.event_id
    }/plugin`,
    { method: "post" },
  );
}

/*
    查询分享插件事件，在应用分享时
*/
export async function getPluginShareEventInShareApp(body = {
  team_name,
  share_id,
  event_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events/${
    body.event_id
    }/plugin`,
    { method: "get" },
  );
}

/*
    查询分享状态
*/
export async function getShareStatus(body = {
  team_name,
  share_id,
  event_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/events/${
    body.event_id
    }`,
    { method: "get" },
  );
}

/*
    完成分享
*/
export async function completeShare(body = {
  team_name,
  share_id,
  event_id,
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/share/${body.share_id}/complete`,
    { method: "post" },
  );
}

/*
  应用备份迁移/恢复
*/
export async function migrateApp(body = {
  team_name,
  region,
  team,
  backup_id,
  group_id,
  migrate_type,
  event_id,
  notRecovered_restore_id
}) {
  console.log(body)
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/migrate`,
    {
      method: "post",
      data: {
        region: body.region,
        team: body.team,
        backup_id: body.backup_id,
        migrate_type: body.migrate_type,
        event_id: body.event_id,
        restore_id: body.notRecovered_restore_id,
      },
    },
  );
}

/*
  应用备份迁移／恢复状态查询
*/
export async function queryMigrateApp(body = { team_name, restore_id, group_id }) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/migrate`,
    {
      method: "get",
      params: {
        restore_id: body.restore_id,
      },
    },
  );
}

/*
  应用备份恢复删除
*/
export async function delRestore(body = { team_name, group_id, new_group_id }) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/delete`,
    {
      method: "DELETE",
      data: {
        new_group_id: body.new_group_id,
      },
    },
  );
}

/*
  应用备份删除
*/
export async function delBackup(body = { team_name, group_id, backup_id }) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/backup`,
    {
      method: "DELETE",
      data: {
        backup_id: body.backup_id,
      },
    },
  );
}

/*
应用失败记录删除
*/
export async function delFailureBackup(body = { team_name, group_id, backup_id }) {
return request(
  `${config.baseUrl}/console/teams/${body.team_name}/groupapp/${body.group_id}/backup`,
  {
    method: "DELETE",
    data: {
      backup_id: body.backup_id,
    },
  },
);
}