//整体导航栏信息
const enterpriseMenu = {
  'menu.enterprise.dashboard': '企业总览',
  'menu.enterprise.share': '应用市场',
  'menu.enterprise.team': '项目/团队',
  'menu.enterprise.cluster': '集群管理',
  'menu.enterprise.user': '用户管理',
  'menu.enterprise.monitoring': '观测中心',
  'menu.enterprise.audit': '审计',
  'menu.enterprise.log': '日志/审计',
  'menu.enterprise.extension': '插件扩展',
  'menu.enterprise.setting': '企业设置',
  'menu.enterprise.order': '订购',
}
const teamMenu = {
  'menu.team.dashboard': '团队总览',
  'menu.team.create': '新建应用',
  'menu.team.create.code': '从源码构建',
  'menu.team.create.image': '从镜像构建',
  'menu.team.create.upload': 'Yaml Helm K8s',
  'menu.team.create.market': '从应用市场安装',
  'menu.team.create.third': '创建第三方组件',
  'menu.team.app': '应用',
  'menu.team.gateway': '网关管理',
  'menu.team.gateway.certificate': '证书管理',
  'menu.team.gateway.control': '访问策略',
  'menu.team.plugin': '插件管理',
  'menu.team.setting': '团队管理',
  'menu.team.pipeline': '流水线',
  'menu.team.log': '日志查询',
  'menu.team.link': '链路追踪',
  'menu.team.create.wizard': '向导页',
}
const appMenu = {
  'menu.app.dashboard': '应用总览',
  'menu.app.publish': '发布应用',
  'menu.app.backup': '应用备份',
  'menu.app.gateway': '网关管理',
  'menu.app.configgroups': '应用配置',
  'menu.app.upgrade': '应用升级',
  'menu.app.dynamic': '应用动态',
  'menu.app.k8s': '资源管理',
  'menu.app.gray': '灰度发布',
};


const CustomFooter = {
  'CustomFooter.goodrain':' 北京好雨科技有限公司出品',
  'CustomFooter.website':'官网',
  'CustomFooter.services':'企业服务',
  'CustomFooter.community':'社区',
  'GlobalHeader.success':'修改成功，请重新登录',
  'GlobalHeader.core':'个人中心',
  'GlobalHeader.edit':'修改密码',
  'GlobalHeader.language':'语言切换',
  'GlobalHeader.exit':'退出登录',
  'GlobalHeader.serve':'企业服务',
  'GlobalHeader.platform':'平台管理',
  'GlobalHeader.close':'是否要关闭新手引导功能、关闭后并无法开启此功能?',
  'GlobalHeader.manual':'使用手册',
  'GlobalHeader.new':'新手引导',
}




export default Object.assign({}, enterpriseMenu, teamMenu, appMenu, CustomFooter);