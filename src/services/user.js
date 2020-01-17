import request from "../utils/request";
import apiconfig from '../../config/api.config';

export async function getTeamByName(body = { team_name }) {
  return request(`${apiconfig.baseUrl}/console/teams/${body.team_name}/detail`, {
    method: "get",
    showMessage: false
  });
}

export async function query() {
  return request("/api/users");
}

export async function queryCurrent() {
  return request("/api/currentUser");
}

/* 第三方认证 */
export async function queryThirdCertification(body = {}, handleError) {
  return request(`${apiconfig.baseUrl}/console/oauth/authorize`, {
    method: "get",
    params: body,
    handleError,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}
/* oauth认证 */
export async function queryOauthType(body = {}) {
  return request(`${apiconfig.baseUrl}/console/oauth/type`, {
    method: "get",
    params: body
  });
}

/* 查询第三方信息 */
export async function queryThirdInfo(body = {}) {
  return request(`${apiconfig.baseUrl}/console/oauth/user`, {
    method: "get",
    params: body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}

/* 重新认证第三方 */
export async function queryCertificationThird(body = { service_id }) {
  return request(`${apiconfig.baseUrl}/console/oauth/refresh/${body.service_id}`, {
    method: "post",
    data: {
      service_id: body.service_id,
      id: body.id
    }
  });
}

/* 绑定第三方 */
export async function queryThirdBinding(body = { service_id, oauth_user_id }) {
  return request(`${apiconfig.baseUrl}/console/oauth/user/link`, {
    method: "post",
    data: {
      service_id: body.service_id,
      oauth_user_id: body.oauth_user_id
    }
  });
}

/* 登录成功后绑定第三方 */
export async function queryThirdLoginBinding(
  body = { service_id, code },
  handleError
) {
  return request(`${apiconfig.baseUrl}/console/oauth/user/authorize`, {
    method: "post",
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
    method: "post",
    data: body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    transformRequest: [
      function(data) {
        let ret = "";
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
  return request(`${apiconfig.baseUrl}/console/users/logout`, { method: "get" });
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
    method: "post",
    data: body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    transformRequest: [
      function(data) {
        let ret = "";
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
    method: "post",
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
    method: "post",
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
    method: "post",
    data: body
  });
}

/*
	查看当前登录用户的详情
*/
export async function getDetail(handleError) {
  return request(`${apiconfig.baseUrl}/console/users/details`, { handleError });
}

/*
	模糊查询用户
*/
export async function search(
  body = {
    key
  }
) {
  return request(`${apiconfig.baseUrl}/console/users/query`, {
    method: "get",
    params: {
      query_key: body.key
    }
  });
}

/*
	获取当前登录用户加入的所有团队
*/
export async function joinedTeams() {
  return request(`${apiconfig.baseUrl}/console/users/teams/query`, {
    method: "get"
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
    method: "post",
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
      method: "post",
      data: {
        project_name: body.project_name
      }
    }
  );
}
