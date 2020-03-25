/*
	对平台信息接口返回的数据的操作判断工具
*/

export default {
  // 判断企业是否配置了导出应用功能
  exportAppEnable: (bean = {}) =>
    (bean && bean.export_app && bean.export_app.enable) || false,

  // 获取logo
  fetchLogo: (enterpriseInfo, enterprise) =>
    (enterprise &&
      enterprise.logo &&
      enterprise.logo.enable &&
      enterprise.logo.value) ||
    (enterpriseInfo &&
      enterpriseInfo.logo &&
      enterpriseInfo.logo.enable &&
      enterpriseInfo.logo.value),
  // 判断企业是否配置了市场支持跨集群
  appstoreImageHubEnable: (bean = {}) =>
    (bean &&
      bean.appstore_image_hub &&
      bean.appstore_image_hub.enable &&
      '支持') ||
    '不支持',

  // 判断平台是否配置了oautg 2.0
  OauthbEnable: (bean = {}) =>
    (bean &&
      bean.enterprise_center_oauth &&
      bean.enterprise_center_oauth.enable &&
      bean.enterprise_center_oauth.value) ||
    false,

  // 判断企业是否配置了oautg 2.0
  OauthEnterpriseEnable: (bean = {}) =>
    (bean &&
      bean.oauth_services &&
      bean.oauth_services.enable &&
      bean.oauth_services.value) ||
    false,

  // 判断管理后台是否配置了oautg 2.0 oauth_services_is_sonsole
  OauthbIsEnable: (bean = {}) =>
    (bean &&
      bean.oauth_services_is_sonsole &&
      bean.oauth_services_is_sonsole.enable) ||
    false,

  // 判断平台配置了oautg 2.0 开启还是关闭状态
  OauthbIsEnableState: (bean = {}) =>
    (bean &&
      bean.oauth_services &&
      bean.oauth_services.enable &&
      bean.oauth_services.value) ||
    false,

  // 判断 有 oautgType 类型
  OauthbTypes: (bean = {}, values) =>
    (bean &&
      bean.oauth_services &&
      bean.oauth_services.enable &&
      bean.oauth_services.value &&
      bean.oauth_services.value.find(item => item.oauth_type === values)) ||
    false,

  // 判断企业是否配置了云应用市场
  cloudMarketEnable: (bean = {}) =>
    (bean && bean.cloud_market && bean.cloud_market.enable) || false,
  // 判断企业是否配置了新手引导
  newbieGuideEnable: (bean = {}) =>
    (bean && bean.newbie_guide && bean.newbie_guide.enable) || false,
  // 判断平台是否配置了官方Demo
  officialDemoEnable: (bean = {}) =>
    (bean && bean.official_demo && bean.official_demo.enable) || false,

  // 判断平台是否配置了具有文档权限
  documentEnable: (bean = {}) =>
    (bean && bean.document && bean.document.enable) || false,
  // 判断平台是否配置了具有文档地址
  documentPlatform_url: (bean = {}) =>
    (bean &&
      bean.document &&
      bean.document.enable &&
      bean.document.value.platform_url) ||
    '',
  OauthParameter: (paraName = '') => {
    const url = document.location.toString();
    const arrObj = url.split('?');

    if (arrObj.length > 1) {
      const arrPara = arrObj[1].split('&');
      let arr;

      for (let i = 0; i < arrPara.length; i++) {
        arr = arrPara[i].split('=');

        if (arr != null && arr[0] == paraName) {
          return arr[1];
        }
      }
      return '';
    }
    return '';
  },
};
