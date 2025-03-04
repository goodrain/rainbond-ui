/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
/* eslint-disable guard-for-in */
/* eslint-disable func-names */
/* eslint-disable no-undef */
import apiconfig from '../../config/api.config';
import request from '../utils/request';

/* Gets the access token data */
export async function fetchAccessToken() {
  return request(`${apiconfig.baseUrl}/console/users/access-token`, {
    method: 'get'
  });
}

export async function upDataUserRoles(param) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${param.enterprise_id}/users/${param.user_id}/teams/${param.team_name}/roles`,
    {
      method: 'post',
      data: {
        role_ids: param.role_ids
      }
    }
  );
}

/* New access to token data */

export async function addAccessToken(data, handleError) {
  return request(`${apiconfig.baseUrl}/console/users/access-token`, {
    method: 'post',
    data,
    handleError
  });
}
/* Update access token data */

export async function putAccessToken(data) {
  return request(
    `${apiconfig.baseUrl}/console/users/access-token/${data.user_id}`,
    {
      method: 'put'
    }
  );
}

/* Deletes the access token data */

export async function deleteAccessToke(data) {
  return request(
    `${apiconfig.baseUrl}/console/users/access-token/${data.user_id}`,
    {
      method: 'delete'
    }
  );
}

export async function getTeamByName(body = { team_name }) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/detail`,
    {
      method: 'get',
      showMessage: false
    }
  );
}

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  return request('/api/currentUser');
}

/* 新增收藏视图 */
export async function addCollectionView(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/user/favorite`,
    {
      method: 'post',
      data: {
        name: body.name,
        url: body.url
      }
    }
  );
}

/* 收藏视图列表 */

export async function queryCollectionViewInfo(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/user/favorite`,
    {
      method: 'get'
    }
  );
}

/* 更新视图列表 */
export async function putCollectionViewInfo(body = { favorite_id }) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/user/favorite/${body.favorite_id}`,
    {
      method: 'put'
    }
  );
}
/*
  删除收藏视图
*/
export async function deleteCollectionViewInfo(
  body = {
    favorite_id
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/user/favorite/${body.favorite_id}`,
    {
      method: 'delete'
    }
  );
}

/* 第三方认证 */
export async function queryThirdCertification(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/oauth/authorize`, {
    method: 'get',
    params: body,
    handleError,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}
/* oauth认证 */
export async function queryOauthType(body = {}) {
  return request(`${apiconfig.baseUrl}/console/oauth/type`, {
    method: 'get',
    params: body
  });
}

/* 查询第三方信息 */
export async function queryThirdInfo(body = {}) {
  return request(`${apiconfig.baseUrl}/console/oauth/user`, {
    method: 'get',
    params: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

/* 重新认证第三方 */
export async function queryCertificationThird(body = { service_id }) {
  return request(
    `${apiconfig.baseUrl}/console/oauth/refresh/${body.service_id}`,
    {
      method: 'post',
      data: {
        service_id: body.service_id,
        id: body.id
      }
    }
  );
}

/* 绑定第三方 */
export async function queryThirdBinding(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/oauth/user/link`, {
    method: 'post',
    data: {
      service_id: body.service_id,
      oauth_user_id: body.oauth_user_id
    },
    handleError
  });
}

/* 登录成功后绑定第三方 */
export async function queryThirdLoginBinding(
  body = { service_id, code },
  handleError
) {
  return request(`${apiconfig.baseUrl}/console/oauth/user/authorize`, {
    method: 'post',
    data: {
      service_id: body.service_id,
      code: body.code
    },
    handleError
  });
}

/* 登录 */
export async function login(
  body = {
    nick_name,
    password
  }
) {
  return request(`${apiconfig.baseUrl}/console/users/login`, {
    method: 'post',
    data: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    transformRequest: [
      function(data) {
        let ret = '';
        for (const it in data) {
          ret += `${encodeURIComponent(it)}=${encodeURIComponent(data[it])}&`;
        }
        return ret;
      }
    ]
  });
}

/* 退出登录 */
export async function logout() {
  return request(`${apiconfig.baseUrl}/console/users/logout`, {
    method: 'get'
  });
}

/* 注册 */
export async function register(
  body = {
    user_name,
    email,
    password,
    password_repeat,
    captcha_code
  }
) {
  return request(`${apiconfig.baseUrl}/console/users/register`, {
    method: 'post',
    data: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    transformRequest: [
      function(data) {
        let ret = '';
        for (const it in data) {
          ret += `${encodeURIComponent(it)}=${encodeURIComponent(data[it])}&`;
        }
        return ret;
      }
    ]
  });
}

/* 发送找回密码邮件 */
export async function send_backpassword_email(
  body = {
    email
  }
) {
  return request(`${apiconfig.baseUrl}/console/users/send_reset_email`, {
    method: 'post',
    data: body
  });
}

/* 重置密码 */
export async function reset_password(
  body = {
    password,
    password_repeat
  }
) {
  return request(`${apiconfig.baseUrl}/console/users/begin_password_reset`, {
    method: 'post',
    data: body
  });
}

/* 修改密码 */
export async function changePass(
  body = {
    password,
    new_password,
    new_password2
  }
) {
  return request(`${apiconfig.baseUrl}/console/users/changepwd`, {
    method: 'post',
    data: body
  });
}

/*
	查看当前登录用户的详情
*/
export async function getDetail(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/users/details`, { 
    method: 'get',
    params: {
      team_name: body.team_name
    },
    handleError 
  });
}

/*
	模糊查询用户
*/
export async function fetchEnterpriseNoTeamUser(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/notjoinusers`,
    {
      method: 'get',
      params: {
        query: body.query,
        page: body.page,
        page_size: body.page_size
      }
    }
  );
}

/*
	获取当前登录用户加入的所有团队
*/
export async function joinedTeams() {
  return request(`${apiconfig.baseUrl}/console/users/teams/query`, {
    method: 'get'
  });
}

/*
  创建在某团队上的gitlab账号
  在用户没有填写邮箱信息的时候需要先注册下
*/

export async function gitlabRegister(
  body = {
    email,
    password
  }
) {
  return request(`${apiconfig.baseUrl}/console/gitlab/register`, {
    method: 'post',
    data: {
      email: body.email,
      password: body.password
    }
  });
}

/*
  创建github项目
*/
export async function createGitlabProject(
  body = {
    team_name,
    project_name
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/code_repo/gitlab`,
    {
      method: 'post',
      data: {
        project_name: body.project_name
      }
    }
  );
}
// 获取用户信息
export async function getUserInfo(handleError) {
  return request(`${apiconfig.baseUrl}/console/users/details`, {
    method: 'get',
    handleError
  });
}
// 修改用户信息
export async function updateUserInfo(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/users/details`, {
    method: 'post',
    data: {
      real_name: body.real_name,
      email: body.email,
      logo: body.logo
    },
    handleError
  });
}
// 获取镜像列表
export async function getImageList(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/hub/registry/image`, {
    method: 'get',
    params: {
      secret_id: body.secret_id,
      namespace: body.namespace || '',
      name: body.name || '',
      tag: body.tag || '',
      page: body.page || 1,
      page_size: body.page_size || 10,
      search_key: body.search_key || '',
    },
    handleError
  });
}
// 生成邀请链接
export async function createInviteLink(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/users/invite`, {
    method: 'post',
    data: {
      team_id: body.team_id,
      role_id: body.role_id
    },
    handleError
  });
}
// 获取邀请链接
export async function getInviteLink(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/users/invite/${body.invite_id}`, {
    method: 'get',
    handleError
  });
}
// 同意邀请
export async function acceptInvite(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/users/invite/${body.invite_id}`, {
    method: 'post',
    data: {
      action : body.action
    },
    handleError
  });
}
