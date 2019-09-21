/*
	对平台信息接口返回的数据的操作判断工具
*/

export default {
  // 判断平台是否配置了github创建应用
  githubEnable: (bean = {}) =>
    (bean.github_config &&
      bean.github_config.enable &&
      bean.github_config.enable) ||
    false,
  // 判断平台是否配置了gitlab(好雨git)创建应用
  gitlabEnable: (bean = {}) =>
    (bean.gitlab_config &&
      bean.gitlab_config.enable &&
      bean.gitlab_config.enable) ||
    false,
  // 获取gitlab(好雨git)绑定的邮箱, 如果这个值为空，则表明还没有绑定gitlab的账号
  getGitlabEmail: (bean = {}) => bean.gitlab_config.admin_email || ""
};
