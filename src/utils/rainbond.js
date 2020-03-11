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
  // 判断平台是否配置了市场支持跨集群
  appstoreImageHubEnable: (bean = {}) =>
    (bean.appstore_image_hub && bean.appstore_image_hub.enable && "支持") ||
    "不支持",

  // 判断平台是否配置了oautg 2.0
  OauthbEnable: (bean = {}) =>
    (bean &&
      (bean.oauth_services &&
        bean.oauth_services.enable &&
        bean.oauth_services.value &&
        bean.oauth_services.value.length > 0)) ||
    false,

  // 判断管理后台是否配置了oautg 2.0 oauth_services_is_sonsole
  OauthbIsEnable: (bean = {}) =>
    (bean.oauth_services_is_sonsole && bean.oauth_services_is_sonsole.enable) ||
    false,

  // 判断平台配置了oautg 2.0 开启还是关闭状态
  OauthbIsEnableState: (bean = {}) =>
    (bean.oauth_services && bean.oauth_services.enable) ||
    false,

  // 判断 有 oautgType 类型
  OauthbTypes: (bean = {}, values) =>
    (bean.oauth_services &&
      bean.oauth_services.enable &&
      bean.oauth_services.value &&
      bean.oauth_services.value.find(item => item.oauth_type === values)) ||
    false,

  //判断平台和用户 是否开启了oauths 功能认证
  OauthbAndUserEnable: (bean = {}, userBean = {}, type) => {
    if (
      bean.oauth_services &&
      bean.oauth_services.enable &&
      bean.oauth_services.value &&
      bean.oauth_services.value.length > 0 &&
      userBean.oauth_services &&
      userBean.oauth_services.length > 0
    ) {
      let certification = false;
      bean.oauth_services.value.map(item => {
        const { oauth_type, enable } = item;
        if (oauth_type === type && enable) {
          userBean.oauth_services.map(items => {
            const { oauth_type, is_authenticated } = items;
            if (oauth_type === type && is_authenticated) {
              certification = true;
            }
          });
        }
      });
      return certification;
    }
    return false;
  },

  // 判断平台是否配置了云应用市场
  cloudMarketEnable: (bean = {}) =>
    (bean.cloud_market && bean.cloud_market.enable) || false,
  // 判断平台是否配置了新手引导
  newbieGuideEnable: (bean = {}) =>
    (bean.newbie_guide && bean.newbie_guide.enable) || false,
  // 判断平台是否配置了官方Demo
  officialDemoEnable: (bean = {}) =>
    (bean.official_demo && bean.official_demo.enable) || false,
  // 判断平台是否配置了具有开通集群权限
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
    "",
  OauthParameter: (paraName = "") => {
    var url = document.location.toString();
    var arrObj = url.split("?");

    if (arrObj.length > 1) {
      var arrPara = arrObj[1].split("&");
      var arr;

      for (var i = 0; i < arrPara.length; i++) {
        arr = arrPara[i].split("=");

        if (arr != null && arr[0] == paraName) {
          return arr[1];
        }
      }
      return "";
    } else {
      return "";
    }
  }
};
