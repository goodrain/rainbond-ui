/* eslint-disable no-undef */
import apiconfig from '../../config/api.config';
import request from '../utils/request';

// edit role
export async function editRole(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/roles/${body.role_id}`,
    {
      method: 'put',
      data: {
        name: body.name
      }
    }
  );
}

// putRolePermissions
export async function putRolePermissions(body = {}) {
  return request(
    // `https://doc.goodrain.org/mock/18/console/teams/${body.team_name}/roles/${body.role_id}/perms`,
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/roles/${body.role_id}/perms`,
    {
      method: 'put',
      data: {
        permissions: body.permissions
      }
    }
  );
}

// delete role
export async function removeRole(body = {}) {
  return request(
    // `https://doc.goodrain.org/mock/18/console/teams/{team_name}/roles/{role_id}`,
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/roles/${body.role_id}`,
    {
      method: 'delete'
    }
  );
}
// create role
export async function createRole(body = {}) {
  return request(
    // `https://doc.goodrain.org/mock/18/console/teams/{team_name}/roles`,{
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/roles`,
    {
      method: 'post',
      data: {
        name: body.name
      }
    }
  );
}

/* fetch teams Role list */
export async function getTeamRoles(body = {}) {
  return request(`${apiconfig.baseUrl}/console/teams/${body.team_name}/roles`, {
    method: 'get',
    params: body
  });
}
/* fetch teams Role Permissions list */
export async function getTeamRolesPermissions(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/roles/${body.role_id}/perms`,
    {
      method: 'get'
    }
  );
}

/* fetch team user Permissions */
export async function getTeamUserPermissions(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/users/${body.user_id}/perms`,
    {
      method: 'get',
      handleError
    }
  );
}

/*
	团队下用户的信息
*/
export async function userDetail(
  body = {
    team_name,
    user_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/${body.user_name}/details`,
    {
      method: 'get'
    }
  );
}

/*
	移交团队管理权限
*/
export async function moveTeam(
  body = {
    team_name,
    user_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/pemtransfer`,
    {
      method: 'post',
      data: {
        user_id: body.user_id
      }
    }
  );
}

/*
	获取团队所有的可选的权限
*/
export async function getTeamPermissions() {
  return request(`${apiconfig.baseUrl}/console/teams/user/identity`, {
    method: 'get'
  });
}

/*
	修改成员角色
*/
export async function editMember(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/users/${body.user_id}/roles`,
    {
      method: 'put',
      data: {
        roles: body.role_ids
      }
    }
  );
}

/*
   创建团队
*/
export async function createTeam(
  body = {
    team_name,
    useable_regions: []
  }
) {
  return request(`${apiconfig.baseUrl}/console/teams/add-teams`, {
    method: 'post',
    data: {
      team_alias: body.team_name,
      useable_regions: body.useable_regions.join(',')
    }
  });
}

/*
	获取团队下的所有成员
*/
export async function getMembers(
  body = {
    team_name,
    page,
    pageSize
  }
) {
  return request(`${apiconfig.baseUrl}/console/teams/${body.team_name}/users`, {
    method: 'get',
    params: body
  });
}

/*
	获取团队下的所有成员
*/
export async function getTeamMembers(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/users/roles`,
    {
      method: 'get',
      params: body
    }
  );
}
export async function getUserTeamsRoles(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/users/${body.user_id}/roles`,
    {
      method: 'get',
      params: body
    }
  );
}
/*
	添加成员
*/
export async function addMember(
  body = {
    team_name,
    user_ids,
    role_ids
  }
) {
  return request(
    // `http://5000.gradb2e2.2c9v614j.17f4cc.grapps.cn/console/teams/${body.team_name}/add_team_user`,
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/add_team_user`,
    {
      method: 'post',
      data: {
        user_ids: body.user_ids,
        role_ids: body.role_ids
      }
    }
  );
}

/*
    删除成员
*/
export async function removeMember(
  body = {
    team_name,
    user_ids
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/users/batch/delete`,
    {
      method: 'delete',
      data: {
        user_ids: [body.user_ids]
      }
    }
  );
}

/*
	修改团队名称
*/
export async function editTeamName(
  body = {
    team_name,
    new_team_alias
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/modifyname`,
    {
      method: 'post',
      data: {
        new_team_alias: body.new_team_alias
      }
    }
  );
}

/*
	删除团队
*/
export async function deleteTeam(
  body = {
    team_name
  },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/delete?force=true`,
    {
      method: 'delete',
      handleError
    }
  );
}

/*
	获取团队下的集群
*/
export async function getRegions(
  body = {
    team_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/region/query`
  );
}

/*
   总览团队在某个集群下的信息
*/
export async function getTeamRegionOverview(
  body = {
    team_name,
    region_name
  },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/overview`,
    {
      showLoading: false,
      params: {
        region_name: body.region_name
      },
      handleError
    }
  );
}

export async function getTeamAppOverview(
  body = {
    team_name,
    region_name
  }
) {
  return request(`${apiconfig.baseUrl}/console/teams/${body.team_name}/size`, {
    showLoading: false
  });
}

/*
	获取团队在某个数据集群下的所有应用
*/
export async function getTeamRegionApps(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/overview/service/over`,
    {
      method: 'get',
      params: body,
      handleError,
      showLoading: false
    }
  );
}

/*
   查询某个团队在某个集群下的所有应用状态
*/
export async function getTeamRegionAppsStatus(
  body = {
    team_name,
    region_name,
    service_ids
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/${body.region_name}/overview/services/status`,
    {
      method: 'post',
      data: {
        service_ids: body.service_ids
      }
    }
  );
}

/*
	获取团队在某个集群下的所有应用组
*/
export async function getTeamRegionGroups(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/overview/groups`,
    {
      method: 'get',
      params: {
        query: body.query,
        region_name: body.region_name
      },
      noModels: body.noModels,
      handleError
    }
  );
}

/*
   获取团队下的证书
*/
export async function getCertificates(
  body = {
    team_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/certificates`,
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
  添加证书
*/
export async function addCertificate(
  body = {
    team_name,
    alias,
    private_key,
    certificate
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/certificates`,
    {
      method: 'post',
      data: {
        alias: body.alias,
        private_key: body.private_key,
        certificate: body.certificate
      }
    }
  );
}

/*
  获取团队下最新操作动态
*/
export async function getNewestEvent(
  body = {
    team_name,
    page,
    page_size
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/services/event`,
    {
      method: 'get',
      params: {
        team_name: body.team_name,
        page: body.page,
        page_size: body.page_size
      }
    }
  );
}

/*
  获取团队未开通的集群列表
*/
export function unOpenRegion(
  body = {
    team_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/region/unopen`,
    {
      method: 'get'
    }
  );
}

/* 开通集群 */
export function openRegion(
  body = {
    team_name,
    region_names
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/region`,
    {
      method: 'patch',
      data: {
        region_names: body.region_names
      }
    }
  );
}

/* 卸载集群 */
export function closeTeamRegion(
  body = {
    teamName,
    regionName
  },
  handleError
) {
  return request(`${apiconfig.baseUrl}/console/teams/${body.teamName}/region`, {
    method: 'delete',
    data: {
      region_name: body.regionName
    },
    handleError
  });
}

/*
  获取团队授权绑定的github信息, 如果未绑定这个接口会返回去绑定的地址
*/
export function getGithubInfo(
  body = {
    team_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/code_repo/github`,
    {
      method: 'get',
      data: {
        tenantName: body.team_name
      }
    }
  );
}

/*
  获取团队授权绑定的gitlub信息
*/
export function getGitlabInfo(
  body = {
    team_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/code_repo/gitlab`,
    {
      method: 'get',
      data: {
        tenantName: body.team_name
      }
    }
  );
}

/*
  获取集群的key
*/
export async function getRegionKey(
  body = {
    team_name,
    region_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/regions/${body.region_name}/publickey`,
    { method: 'get' }
  );
}

/*
  退出团队
*/
export async function exitTeam(
  body = {
    team_name
  }
) {
  return request(`${apiconfig.baseUrl}/console/teams/${body.team_name}/exit`, {
    method: 'get'
  });
}

/*
  用户查询加入状态
 */
export async function getJoinTeamUsers(body = { team_name }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/applicants`,
    {
      method: 'get'
    }
  );
}

/*
  审批用户加入
 */
export async function setJoinTeamUsers(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/applicants`,
    {
      method: 'put',
      data: {
        user_id: body.user_id,
        action: body.action,
        role_ids: body.role_ids
      }
    }
  );
}

/*
  撤销申请团队
 */
export async function undoTeamUsers(body = { team_name, user_id, action }) {
  return request(`${apiconfig.baseUrl}/console/user/applicants/join`, {
    method: 'put',
    data: {
      team_name: body.team_name
    }
  });
}

/*
  ADD Team
 */
export async function joinTeam(body = {}) {
  return request(`${apiconfig.baseUrl}/console/enterprise/admin/join-team`, {
    method: 'post',
    data: {
      team_name: body.team_name
    }
  });
}

export async function stopComponentInTeam(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/close`,
    {
      method: 'post',
      data: {},
      handleError
    }
  );
}

export async function stopComponentInTenant(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/close`,
    {
      method: 'post',
      data: {
        region_name: body.region_name
      },
      handleError
    }
  );
}

export async function fetchFeatures(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/regions/${body.region_name}/features`,
    {
      method: 'get',
      handleError
    }
  );
}
