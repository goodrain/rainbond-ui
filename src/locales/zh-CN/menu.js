//整体导航栏信息
const enterpriseMenu = {
  'menu.enterprise.dashboard': '总览',
  'menu.enterprise.share': '应用市场',
  'menu.enterprise.team': '项目/团队',
  'menu.enterprise.cluster': '集群',
  'menu.enterprise.user': '用户',
  'menu.enterprise.monitoring': '监控',
  'menu.enterprise.audit': '审计',
  'menu.enterprise.setting': '设置',
}
const teamMenu = {
  'menu.team.dashboard': '总览',
  'menu.team.create': '新增',
  'menu.team.create.code': '从源码构建',
  'menu.team.create.image': '从镜像构建',
  'menu.team.create.upload': 'Kubernetes YAML导入',
  'menu.team.create.market': '从应用市场安装',
  'menu.team.create.third': '创建第三方组件',
  'menu.team.app': '应用',
  'menu.team.gateway': '网关',
  'menu.team.gateway.certificate': '证书管理',
  'menu.team.gateway.control': '访问策略管理',
  'menu.team.plugin': '插件',
  'menu.team.setting': '团队管理',
}
const appMenu = {
  'menu.app.dashboard': '总览',
  'menu.app.publish': '发布',
  'menu.app.backup': '备份',
  'menu.app.gateway': '网关',
  'menu.app.configgroups': '配置',
  'menu.app.k8s': 'k8s资源',
  'menu.app.upgrade': '升级',
};




export default Object.assign({}, enterpriseMenu, teamMenu, appMenu);