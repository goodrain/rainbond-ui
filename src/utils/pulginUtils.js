
// 定义插件所在视图，支持平台、团队、应用和组件四个范围。对应取值为Platform、Team、Application、Component
export default {
  // 对企业级、团队级、应用级的插件列表进行筛选归类
  segregatePluginsByHierarchy (list,type){
    const arr = (list || []).filter(item => item?.plugin_views.includes(type)).map(item => item);
    return arr
  },
  // 判断当前路由的视图位置
  getCurrentViewPosition(urlPath){
          const url = new URL(urlPath);
          const path = url.hash.substring(1);
          const enterpriseRegex = /^\/enterprise\/[\w-]+/;
          const teamRegionRegex = /^\/team\/[\w-]+\/region\/[\w-]+/;
          const teamAppRegex = /^\/team\/[\w-]+\/region\/[\w-]+\/apps/;
          if (enterpriseRegex.test(path)) {
              return 'Platform';
          } else if (teamRegionRegex.test(path)&&!teamAppRegex.test(path)) {
              return 'Team';
          } else if (teamAppRegex.test(path) && teamRegionRegex.test(path)) {
              return 'Application';
          } else {
              return 'Component';
          }
  }
}