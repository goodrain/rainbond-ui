import { stringify } from "qs";
import request from "../utils/request";
import config from "../config/config";

/*
  获取企业所有数据中心的每小时按需消费明细
 */
export async function getAllRegionFee(body = { team_name, date }) {
  return request(`${config.baseUrl}/console/enterprise/team/${body.team_name}/all-region-fee`, {
    method: "get",
    params: {
      date: body.date,
    },
  });
}

/*
  获取用户可加入团队列表
 */
export async function getAllTeams(body = { user_id, page_size }) {
  return request(`${config.baseUrl}/console/user/jointeams`, {
    method: "get",
    params: {
      user_id: body.user_id,
      page_size: body.page_size,
    },
  });
}

/*
  用户加入团队
 */
export async function joinTeam(body = { team_name }) {
  return request(`${config.baseUrl}/console/user/applicants/join`, {
    method: "post",
    data: {
      team_name: body.team_name,
    },
  });
}

/*
  用户查询加入状态
 */
export async function getJoinTeam(body = { user_id }) {
  return request(`${config.baseUrl}/console/user/applicants/join`, {
    method: "get",
    params: {
      user_id: body.user_id,
    },
  });
}

/*
  用户删除团队状态
 */
export async function deleteJoinTeam(body = { user_id, is_pass, team_name }) {
  return request(`${config.baseUrl}/console/user/applicants/join`, {
    method: "delete",
    data: {
      user_id: body.user_id,
      is_pass: body.is_pass,
      team_name: body.team_name,
    },
  });
}


/* 内部市场删除插件 */
export async function deleteMarketPlugin(body = { plugin_id }) {
  return request(`${config.baseUrl}/console/market/plugins/uninstall-template`, {
    method: "post",
    data: {
      plugin_id: body.plugin_id,
    },
  });
}

/* 云端同步插件 */
export async function syncCloudPlugin() {
  return request(`${config.baseUrl}/console/market/plugins/sync`, {
    method: "post",
  });
}

/* 获取云端插件 */
export async function getCloudPlugin(body = { plugin_name, page }) {
  return request(`${config.baseUrl}/console/market/plugins`, {
    method: "get",
    params: {
      plugin_name: body.plugin_name,
      page: body.page,
      limit: body.limit,
    },
  });
}

/*
  获取企业充值记录
 */
export async function getPayHistory(body = {
  team_name,
  start,
  end,
  page,
  page_size,
}) {
  return request(`${config.baseUrl}/console/enterprise/team/${body.team_name}/recharge-records`, {
    method: "get",
    params: {
      start: body.start,
      end: body.end,
      page: body.page,
      page_size: body.page_size,
    },
  });
}

/* 完成分享 */
export async function complatePluginShare(body = { team_name, share_id }) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/plugin-share/${body.share_id}/complete`,
    {
      method: "post",
      data: {
        plugin_key: body.plugin_key,
        version: body.version,
      },
    },
  );
}

/* 同步插件模版 */
export async function syncMarketPluginTmp(body = { plugin_key, version }) {
  return request(`${config.baseUrl}/console/market/plugins/sync-template`, {
    method: "post",
    data: {
      plugin_key: body.plugin_key,
      version: body.version,
    },
  });
}

/* 同步云市插件 */
export async function syncMarketPlugins() {
  return request(`${config.baseUrl}/console/market/plugins/sync`, {
    method: "post",
  });
}

/* 获取内部市场插件 */
export async function getMarketPlugins(body = { plugin_name, page }) {
  return request(`${config.baseUrl}/console/plugins`, {
    method: "get",
    params: {
      plugin_name: body.plugin_name,
      page: body.page,
      limit: body.limit,
    },
  });
}

/*
  初始化一个团队
*/
export async function InitTeam(body = { team_alias, region_name }) {
  return request(`${config.baseUrl}/console/teams/init`, {
    method: "post",
    data: body,
  });
}

/* 获取某个数据中心的资源详情 */
export async function getRegionSource(body = { team_name, region }) {
  return request(`${config.baseUrl}/console/enterprise/region/resource`, {
    method: "get",
    params: {
      team_name: body.team_name,
      region: body.region,
    },
  });
}
/* 获取团队应用模块 */
export async function getTeamList(body = {
  team_name, region, page,
  page_size
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/overview/app/over`, {
    method: "get",
    params: {
      team_name: body.team_name,
      page: body.page,
      page_size: body.page_size,
      team_name: ""
    },
  });
}

/* 获取团队应用模块 */
export async function getGuideState(body = {
  team_name, 
}) {
  return request(`${config.baseUrl}/console/enterprise/${body.enterprise_id}/base-guidance`, {
    method: "get",
  });
}


/* 获取热门域名访问模块 */
export async function getDomainName(body = { team_name, region_name, page, page_size, id, start, step,end }) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/regions/${body.region_name}/sort_domain/query?repo=${body.id}`, {
      method: "get",
      params: {
        // query:`sort_desc(sum( ceil(increase(gateway_requests[1h]))) by (host))`,
        // query:`sort_desc(sum( ceil(increase(gateway_requests{namespace=”765738e17a294a74a704e381e018de80”}[1h]))) by (service))`,
        // query:`sort_desc(sum(ceil(increase(app_request{tenant_id=”765738e17a294a74a704e381e018de80”,method=”total”}[1h])))by (service_id))`,
        end: body.end || new Date().getTime() / 1000,
        start: body.start,
        step: body.step,
        page: body.page,
        page_size: body.page_size,
      },
    });
}


/* 获取热门服务访问模块 */
export async function getService(body = { team_name, region_name, page, page_size }) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/regions/${body.region_name}/sort_service/query`, {
    method: "get",
    params: {
      // query:`sort_desc(sum(ceil(increase(app_request{method="total"}[1h])))by (service_id))`,
      // query: `sort_desc(sum( ceil(increase(gateway_requests[1h]))) by (service))`,
      page: body.page,
      page_size: body.page_size,
    },
  });
}
// https://console.goodrain.com/console/teams/23ehgni5/apps/gr3698ab/monitor/query_range?query=sum(ceil(increase(app_request%7Bservice_id%3D%22dde947ccc8cc6fe46c734dddd13698ab%22,method%3D%22total%22%7D[1m])%2F12))
/*
	 获取应用吞吐率监控数据(一段时间内数据)
*/
export async function getDomainTime(body = {
  team_name,
  app_alias,
  tenant_id
}) {
  return request(
    `${config.baseUrl}/console/teams/${body.team_name}/regions/${body.region_name}/query_range/query`, {
      method: "get",
      showMessage: false,
      params: {
        query:
          `ceil(sum(increase(gateway_requests{namespace=”${
          body.tenant_id
          }”}[1h])))`,
        // start: body.start,
        // end: body.end || new Date().getTime() / 1000,
        // step: body.step,
      }
    },
  );
}




/* 获取企业详情 */
export async function getCompanyInfo(body = { team_name }) {
  return request(`${config.baseUrl}/console/enterprise/account`, {
    method: "get",
    params: {
      team_name: body.team_name,
    },
  });
}

/* 获取某数据中心下某一天的资源费用数据 */
export async function getRegionOneDayMoney(body = { team_name, date, region }) {
  return request(`${config.baseUrl}/console/enterprise/team/${body.team_name}/fee`, {
    method: "get",
    params: {
      date: body.date,
      region: body.region,
    },
  });
}

/* 认证企业 */
export async function authEnterprise(body = {
  team_name,
  enterprise_id,
  market_info,
  market_client_id,
  market_client_token,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/enterprise/active/optimiz`, {
    method: "post",
    data: {
      enterprise_id: body.enterprise_id,
      // market_client_id: body.market_client_id,
      // market_client_token: body.market_client_token,
      market_info: body.market_info.replace(/\s+/g, "")
    },
  });
}
/* 从云市同步应用的详细模板 */
export async function getVersion(body = {
  app_name,
  version,
  group_key,
}) {
  return request(`${config.baseUrl}/console/app_market/version`, {
    method: "get",
    params: {
      app_name: body.app_name,
      version: body.version,
      group_key: body.group_key,
    },
  });
}

/* 卸载云市已下载的应用 */
export async function offlineMarketApp(body = { app_id }) {
  return request(`${config.baseUrl}/console/app_market/manage`, {
    method: "post",
    data: {
      group_key: body.group_key,
      group_version_list: body.group_version_list,
      app_id: body.app_id,
      action: "offline",
    },
  });
}

/* 从云市同步应用的详细模板 */
export async function syncMarketAppDetail(body = {
  team_name,
  body,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/apps/template_details`, {
    method: "post",
    data: body.body,
  });
}

/* 查询所有同步的应用 */
export async function getMarketApp(body = {
  app_name,
  page,
  pageSize,
  is_complete,
}) {
  return request(`${config.baseUrl}/console/app_market/all`, {
    method: "get",
    params: {
      app_name: body.app_name,
      page: body.page,
      page_size: body.pageSize,
      is_complete: body.is_complete,
    },
  });
}

/*
  从好雨云市同步应用
*/
export async function syncMarketApp(body = {
  team_name,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/apps/all_apps`, {
    method: "get",
  });
}

/*
   获取云帮的公共信息、配置信息
*/
export function getRainbondInfo() {
  return request(`${config.baseUrl}/console/config/info`, { passAuthorization: false });
}

/*
   绑定github
*/
export async function bindGithub(body = {
  code,
  state,
}) {
  return request(`${config.baseUrl}/console/github/callback`, {
    method: "post",
    data: {
      code: body.code,
      state: body.state,
    },
  });
}

/*
  获取github授权地址
*/

/* 判断是否是公有云云帮 */
export async function isPubCloud() {
  return request(`${config.baseUrl}/console/checksource`);
}

// 获取全部数据中心
export function getAllRegion() {
  return request(`${config.baseUrl}/console/regions`, { method: "get" });
}

export async function queryProjectNotice() {
  return request("/api/project/notice");
}

export async function queryActivities() {
  return request("/api/activities");
}

export async function queryRule(params) {
  return request(`/api/rule?${stringify(params)}`);
}

export async function removeRule(params) {
  return request("/api/rule", {
    method: "POST",
    body: {
      ...params,
      method: "delete",
    },
  });
}

export async function addRule(params) {
  return request("/api/rule", {
    method: "POST",
    body: {
      ...params,
      method: "post",
    },
  });
}

export async function fakeSubmitForm(params) {
  return request("/api/forms", {
    method: "POST",
    body: params,
  });
}

export async function fakeChartData() {
  return request("/api/fake_chart_data");
}

export async function queryTags() {
  return request("/api/tags");
}

export async function queryBasicProfile() {
  return request("/api/profile/basic");
}

export async function queryAdvancedProfile() {
  return request("/api/profile/advanced");
}

export async function queryFakeList(params) {
  return request(`/api/fake_list?${stringify(params)}`);
}

export async function fakeAccountLogin(params) {
  return request("/api/login/account", {
    method: "POST",
    body: params,
  });
}

export async function fakeRegister(params) {
  return request("/api/register", {
    method: "POST",
    body: params,
  });
}

export async function queryNotices() {
  return request("/api/notices");
}

/* 查询用户站内信 */
export async function getuserMessage(body = {
  team_name,
  page_num,
  page_size,
  msg_type,
  is_read,
}) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/message`, {
    method: "get",
    params: {
      page_num: body.page_num,
      page_size: body.page_size,
      msg_type: body.msg_type,
      is_read: body.is_read,
    },
  });
}

/* 消息标记为已读未读 */
export async function putMsgAction(body = { team_name, msg_ids, action }) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/message`, {
    method: "put",
    data: {
      action: body.action,
      msg_ids: body.msg_ids,
    },
  });
}

/* 删除站内信 */
export async function deleteMsg(body = { team_name, msg_ids }) {
  return request(`${config.baseUrl}/console/teams/${body.team_name}/message`, {
    method: "delete",
    data: {
      msg_ids: body.msg_ids,
    },
  });
}

/* 资源价格计算 */
export async function resPrice(body = {
  team_name,
  region_name,
  memory,
  disk,
  rent_time,
}) {
  return request(`${config.baseUrl}/console/enterprise/regions/${body.region_name}/res-price`, {
    method: "post",
    data: {
      team_name: body.team_name,
      region_name: body.region_name,
      memory: body.memory,
      disk: body.disk,
      rent_time: body.rent_time,
    },
  });
}

/* 资源购买 */
export async function buyPurchase(body = {
  team_name,
  region_name,
  memory,
  disk,
  rent_time,
}) {
  return request(`${config.baseUrl}/console/enterprise/regions/${body.region_name}/purchase`, {
    method: "post",
    data: {
      team_name: body.team_name,
      region_name: body.region_name,
      memory: body.memory,
      disk: body.disk,
      rent_time: body.rent_time,
    },
  });
}

/* 查询企业信息 */
export async function getEnterpriseInfo(param) {
  return request(`${config.baseUrl}/console/enterprise/info`, {
    method: "get",
    params: {
      team_name: param.team_name
    }
  });
}

/* 查询企业信息 */
export async function getEnterpriseTeams(body = { page_num, page_size, team_name }) {
  return request(`${config.baseUrl}/console/enterprise/teams`, {
    method: "get",
    params: {
      page_num: body.page_num,
      page_size: body.page_size,
      team_name: body.team_name
    },
  });
}

/* 设置注册功能 */
export async function setRegist(body = { isRegist }) {
  return request(`${config.baseUrl}/console/enterprise/registerstatus`, {
    method: "put",
    data: { is_regist: body.isRegist },
  });
}

/* 设置注册功能 */
export async function getRegist(body = {}) {
  return request(`${config.baseUrl}/console/enterprise/registerstatus`, {
    method: "get",
  });
}
/** 获取权限 */
export async function queryAuthority(params) {
  return request(`${config.baseUrl}/console/teams/${params.selectedTeam}/role-list`, {
    method: "get",
  });
}

/**创建用户 */
export async function toCreatUser(params) {
  return request(`${config.baseUrl}/console/enterprise/admin/add-user`, {
    method: "post",
    data: {
      tenant_name: params.tenant_name,
      user_name: params.user_name,
      phone: params.phone,
      email: params.email,
      password: params.password,
      re_password: params.password,
      role_ids: params.identity.join(","),
    }
  });
}
/**构建拓扑图 */
export async function toBuildShape(params) {
  return request(`${config.baseUrl}/console/teams/${params.tenantName}/groups/${params.group_id}/common_operation `, {
    method: "post",
    data: {
      tenantName: params.tenantName,
      group_id: params.group_id,
      action: params.action,
    }
  });
}

/**获取所有的拓扑图 */
export async function toQueryTopology(params) {
  return request(`${config.baseUrl}/console/teams/${params.team_name}/topological?group_id=${params.groupId}&region=${params.region_name}`, {
    method: "get",
  });
}

/**获取所有可访问的link */
export async function toQueryLinks(params) {
  return request(`${config.baseUrl}/console/teams/${params.team_name}/group/service/visit?service_alias=${params.service_alias}`, {
    method: "get",
  });
}


export async function toSearchTenant(params) {
  return request(`${config.baseUrl}/console/enterprise/teams`, {
    method: "get",
    params: {
      tenant_alias: params.tenant,
      page_num: params.page_num || 1,
      page_size: params.page_size || 1000,
    }
  });
}
