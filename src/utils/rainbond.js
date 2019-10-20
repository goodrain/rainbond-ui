/*
	对平台信息接口返回的数据的操作判断工具
*/

export default {
  // 判断平台是否配置了github创建应用
  githubEnable: (bean = {}) => (bean.github && bean.github.enable) || false,
  // 判断平台是否配置了gitlab(好雨git)创建应用
  gitlabEnable: (bean = {}) => (bean.gitlab && bean.gitlab.enable) || false,
  // 获取gitlab(好雨git)绑定的邮箱, 如果这个值为空，则表明还没有绑定gitlab的账号
  getGitlabEmail: (bean = {}) =>
    (bean.gitlab && bean.gitlab.enable && bean.gitlab.value.admin_email) || "",
  // 判断平台是否配置了导出应用功能
  exportAppEnable: (bean = {}) =>
    (bean.export_app && bean.export_app.enable) || false,
  // 判断平台是否配置了市场支持跨数据中心
  appstoreImageHubEnable: (bean = {}) =>
    (bean.appstore_image_hub && bean.appstore_image_hub.enable && "支持") ||
    "不支持",

  // 判断平台是否配置了云应用市场
  cloudMarketEnable: (bean = {}) =>
    (bean.cloud_market && bean.cloud_market.enable) || false,
  // 判断平台是否配置了新手引导
  newbieGuideEnable: (bean = {}) =>
    (bean.newbie_guide && bean.newbie_guide.enable) || false,
  // 判断平台是否配置了官方Demo
  officialDemoEnable: (bean = {}) =>
    (bean.official_demo && bean.official_demo.enable) || false,
  // 判断平台是否配置了具有开通数据中心权限
  openDataCenterStatusEnable: (bean = {}) =>
    (bean.open_data_center_status && bean.open_data_center_status.enable) ||
    false,
  // 判断平台是否配置了具有文档权限
  documentEnable: (bean = {}) =>
    (bean.document && bean.document.enable) || false,
  // 判断平台是否配置了具有文档地址
  documentPlatform_url: (bean = {}) =>
    (bean.document &&
      bean.document.enable &&
      bean.document.value.platform_url) ||
    ""
};
