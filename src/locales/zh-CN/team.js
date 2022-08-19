// 团队下的信息

//总览页面
const teamOverview = {
  'teamOverview.app.name': '应用',
  'teamOverview.component.name': '组件',
  'teamOverview.useResource': '使用资源',
  'teamOverview.UserNum': '用户数量',
  'teamOverview.appNum': '应用数量',
  'teamOverview.memoryUsage': '内存使用量',
  'teamOverview.diskUsage': '磁盘使用量',
  'teamOverview.runAppNum': '{ number }个运行的应用',
  'teamOverview.notRunAppNum': '{ number }个未运行的应用',
  'teamOverview.appSum': '共{ number }个应用',
  'teamOverview.componentSum': '共{ number }个组件',
  'teamOverview.runComponentNum': '{ number }个运行的组件',
  'teamOverview.notRunComponentNum': '{ number }个未运行的组件',
  'teamOverview.runStatusSort': '运行状态排序',
  'teamOverview.updateTimeSort': '更新时间排序',
  'teamOverview.searchTips': '请输入应用名称进行搜索',
  'teamOverview.createApp': '新建应用',
  'teamOverview.update': '更新',
  'teamOverview.memory': '内存',
  'teamOverview.visit': '访问',
  'teamOverview.appList': '应用列表',
}

//团队下的应用
const teamApply = {
  'teamApply.title':'应用管理',
  'teamApply.desc':'应用可以是一个工程，一个架构，一个业务系统的管理单元，其由多个组件和应用配置构成',
  'teamApply.searchTips':'搜索应用',
  'teamApply.search':'搜索',
  'teamApply.createApp':'新建应用',
  'teamApply.appName':'应用名称',
  'teamApply.updateTime':'更新时间',
  'teamApply.createTime':'创建时间',
  'teamApply.componentNumComparison':'组件(运行/总数)',
  'teamApply.memoryNumComparison':'占用内存/分配内存(MB)',
  'teamApply.duplicateRecord':'备份记录',
  'teamApply.releaseRecord':'发布记录',
  'teamApply.remarks':'备注',
}

//团队下的创建 code、image、upload、market、third
const teamAdd = {
  // 公共
  'teamAdd.create.appName':'应用名称',
  'teamAdd.create.componentName':'组件名称',
  'teamAdd.create.componentUSName':'组件英文名称',
  'teamAdd.create.user':'仓库用户名',
  'teamAdd.create.password':'仓库密码',
  'teamAdd.create.create':'确认创建',
  // code
  'teamAdd.create.code.title':'由源码创建组件',
  'teamAdd.create.code.desc':'从指定源码仓库中获取源码，基于源码信息创建新组件',
  'teamAdd.create.code.customSource':'自定义源码',
  'teamAdd.create.code.demo':'官方DEMO',
  'teamAdd.create.code.address':'仓库地址',
  'teamAdd.create.code.versions':'代码版本',
  'teamAdd.create.code.branch':'分支',
  'teamAdd.create.code.fillInUser':'填写仓库账号密码',
  'teamAdd.create.code.fillInPath':'填写子目录路径',
  'teamAdd.create.code.path':'子目录路径',
  
  // image
  'teamAdd.create.image.title':'从Docker镜像创建组件',
  'teamAdd.create.image.desc':'支持从单一镜像、Docker命令、DockerCompose配置创建应用',
  'teamAdd.create.image.tabImage':'指定镜像',
  'teamAdd.create.image.order':'命令',
  'teamAdd.create.image.hint':'这是一个私有仓库?填写仓库账号密码',
  'teamAdd.create.image.mirrorAddress':'镜像地址',
  'teamAdd.create.image.config':'配置',
  'teamAdd.create.image.configHint':'注意将解析 DockerCompose 配置中的组件相关属性用来便捷创建组件，其中的动态变量不支持解析赋值, 其中使用了私有仓库的镜像? 填写仓库账号密码',

  //upload
  'teamAdd.create.upload.title':'上传文件创建',
  'teamAdd.create.upload.desc':'第三方组件，即运行于平台集群外的组件，在平台中创建组件即可以将其与 平台网关无缝对接，同时也可以被平台内服务访问。满足用户通过平台可以对各类组件进行统一的监控和管理需要。',
  'teamAdd.create.upload.format':'上传格式',
  'teamAdd.create.upload.uploadFiles':'上传文件',
  'teamAdd.create.upload.uploadJWar':'支持Jar、War格式上传文件',
  'teamAdd.create.upload.uploadYaml':'只支持yaml格式上传多文件',

  //market
  
  //third
  'teamAdd.create.third.title':'添加第三方组件',
  'teamAdd.create.third.desc':'第三方组件，即运行于平台集群外的组件，在平台中创建组件即可以将其与平台网关无缝对接，同时也可以被平台内服务访问。满足用户通过平台可以对 各类组件进行统一的监控和管理的需要。',
  'teamAdd.create.third.componentRegister':'组件注册方式',
  'teamAdd.create.third.staticRegister':'静态注册',
  'teamAdd.create.third.apiRegister':'API注册',
  'teamAdd.create.third.componentAddress':'组件地址',

}

//团队下的网关
const teamGateway = {

  // strategy
  'teamGateway.strategy.title':'访问控制',
  'teamGateway.strategy.placeholder':'搜索域名/应用/组件',
  'teamGateway.strategy.btn.search':'搜索',
  'teamGateway.strategy.table.domain':'域名',
  'teamGateway.strategy.table.type':'类型',
  'teamGateway.strategy.table.route':'高级路由',
  'teamGateway.strategy.table.certificate':'证书',
  'teamGateway.strategy.table.app':'应用',
  'teamGateway.strategy.table.port':'组件端口',
  'teamGateway.strategy.table.operate':'操作',
  'teamGateway.strategy.table.config':'参数配置',
  'teamGateway.strategy.table.edit':'编辑',
  'teamGateway.strategy.table.delete':'删除',

  // certificate
  'teamGateway.certificate.title':'证书管理',
  'teamGateway.certificate.desc':'TLS证书管理，支持服务端证书，支持展示证书过期时间',
  'teamGateway.certificate.btn.add':'添加证书',
  'teamGateway.certificate.table.name':'证书名称',
  'teamGateway.certificate.table.address':'证书地址',
  'teamGateway.certificate.table.time':'过期时间',
  'teamGateway.certificate.table.type':'证书类型',
  'teamGateway.certificate.table.source':'证书来源',
  'teamGateway.certificate.table.operate':'操作',
  'teamGateway.certificate.table.edit':'编辑',
  'teamGateway.certificate.table.delete':'删除',
}

const teamPlugin = {
  'teamPlugin.title':'我的插件',
  'teamPlugin.desc':'应用插件是标准化的为应用提供功能扩展，与应用共同运行的程序',
  'teamPlugin.hint':'从应用市场安装/新建插件',
  'teamPlugin.btn.marketAdd':'从应用市场安装',
  'teamPlugin.btn.add':'新建插件',
  'teamPlugin.btn.delete':'删除',
  'teamPlugin.btn.manage':'管理',
}

const teamManage = {
  'teamManage.create.time':'创建于',
  'teamManage.tabs.deleteTeam':'删除团队',
  // 动态 dynamic
  'teamManage.tabs.dynamic':'动态',
  'teamManage.tabs.dynamic.title.addTeam':'以下用户申请加入团队',
  'teamManage.tabs.dynamic.table.user':'用户',
  'teamManage.tabs.dynamic.table.time':'申请时间',
  'teamManage.tabs.dynamic.table.operate':'操作',
  'teamManage.tabs.dynamic.table.btn.through':'通过',
  'teamManage.tabs.dynamic.table.btn.refuse':'拒绝',
  'teamManage.tabs.dynamic.title.dynamic':'动态',
  'teamManage.tabs.dynamic.table.name':'应用名称',
  'teamManage.tabs.dynamic.table.operateTime':'操作时间',
  'teamManage.tabs.dynamic.table.operateContent':'操作内容',
  'teamManage.tabs.dynamic.table.operateDetail':'操作详情',
  'teamManage.tabs.dynamic.table.btn.checkDetail':'查看详情',

  //成员 member
  'teamManage.tabs.member':'成员',
  'teamManage.tabs.member.title':'团队成员',
  'teamManage.tabs.member.btn.add':'添加成员',
  'teamManage.tabs.member.table.userName':'用户名称',
  'teamManage.tabs.member.table.name':'姓名',
  'teamManage.tabs.member.table.email':'邮箱',
  'teamManage.tabs.member.table.role':'角色',
  'teamManage.tabs.member.table.operate':'操作',
  'teamManage.tabs.member.table.delete':'删除',
  'teamManage.tabs.member.table.editRole':'修改角色',

  //集群 cluster
  'teamManage.tabs.cluster':'集群',
  'teamManage.tabs.cluster.openCluster':'已开通集群',
  'teamManage.tabs.cluster.open':'开通集群',
  'teamManage.tabs.cluster.unload':'卸载',
  'teamManage.tabs.cluster.opened':'开通于',

  // 角色 role
  'teamManage.tabs.role':'角色',
  'teamManage.tabs.role.title':'角色列表',
  'teamManage.tabs.role.list.admin':'管理员',
  'teamManage.tabs.role.list.developer':'开发者',
  'teamManage.tabs.role.list.viewer':'观察者',
  'teamManage.tabs.role.list.access':'访问者',
  'teamManage.tabs.role.list.owner':'拥有者',
  'teamManage.tabs.role.list.admin':'企业管理员',
  'teamManage.tabs.role.list.app_store':'应用市场管理员',
  // 权限设置 Permissions
  'teamManage.tabs.role.list.permissions.roleName':'角色名称',
  'teamManage.tabs.role.list.permissions.allot':'权限分配',
  'teamManage.tabs.role.list.permissions.teamMsg':'查看团队信息',
  'teamManage.tabs.role.list.permissions.teamDynamic':'查看团队动态',
  'teamManage.tabs.role.list.permissions.maven':'管理Maven配置',
  'teamManage.tabs.role.list.permissions.teamRegion':'团队集群管理',
  'teamManage.tabs.role.list.permissions.teamMember':'团队成员管理',
  'teamManage.tabs.role.list.permissions.teamRole':'团队角色管理',
  'teamManage.tabs.role.list.permissions.app_config_group':'应用配置组管理',
  'teamManage.tabs.role.list.permissions.teamRegistryAuth':'镜像仓库授权信息管理',
  'teamManage.tabs.role.list.permissions.certificate':'证书管理',
  'teamManage.tabs.role.list.permissions.gatewayRule':'网关访问策略管理',
  'teamManage.tabs.role.list.permissions.app':'应用管理',
  'teamManage.tabs.role.list.permissions.component':'组件管理',
  'teamManage.tabs.role.list.permissions.plugin':'插件管理',

  //镜像仓库授权信息 image
  'teamManage.tabs.image':'镜像仓库授权信息',
  'teamManage.tabs.image.table.imageAddress':'镜像仓库地址',
  'teamManage.tabs.image.table.user':'用户名',
  'teamManage.tabs.image.table.password':'密码',
  'teamManage.tabs.image.table.operate':'操作',
  'teamManage.tabs.image.table.btn.add':'添加',
  'teamManage.tabs.image.table.btn.edit':'修改',
  'teamManage.tabs.image.table.btn.delete':'删除',
  
}



export default Object.assign({}, teamOverview, teamApply, teamAdd, teamGateway, teamPlugin, teamManage);