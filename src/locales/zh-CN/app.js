// 应用下的信息

//应用总览
const appOverview = {
  'appOverview.memory': '使用内存',
  'appOverview.cpu': '使用CPU',
  'appOverview.disk': '使用磁盘',
  'appOverview.componentNum': '组件数量',
  'appOverview.createTime': '创建时间',
  'appOverview.updateTime': '更新时间',
  'appOverview.govern': '治理模式',
  'appOverview.principal': '负责人',
  'appOverview.backups': '备份',
  'appOverview.modelRelease': '模型发布',
  'appOverview.gateway': '网关策略',
  'appOverview.upgrade': '待升级',
  'appOverview.config': '配置组',
  'appOverview.btn.update':'更新',
  'appOverview.btn.build':'构建',
  'appOverview.btn.copy':'快速复制',
  'appOverview.btn.visit':'访问',
  'appOverview.btn.start':'启动',
  'appOverview.btn.stop':'停用',
  'appOverview.btn.ordinary':'普通模式',
  'appOverview.btn.aggregation':'聚合模式',
  'appOverview.btn.arrange':'编排模式',
  'appOverview.btn.addComponent':'添加组件',
  'appOverview.topology': '拓扑图',
  'appOverview.list': '列表',
  'appOverview.list.table.btn.name': '组件名称',
  'appOverview.list.table.memory': '内存',
  'appOverview.list.table.status': '状态',
  'appOverview.list.table.updateTime': '更新时间',
  'appOverview.list.table.operate': '操作',
  'appOverview.list.table.restart': '重启',
  'appOverview.list.table.start': '启动',
  'appOverview.list.table.stop': '关闭',
  'appOverview.list.table.batchOperate': '批量操作',
  'appOverview.list.input.seach.hint': '请搜索组件',
  'appOverview.list.btn.seach': '搜索',
};

//应用发布
const appPublish = {
  'appPublish.title': '发布记录管理',
  'appPublish.desc': '应用发布是指将当前运行的应用进行模型化，形成应用模版发布到企业应用市场或云端应用商店中，从而支持应用的标准化交付或共享',
  'appPublish.btn.local':'发布到组件库',
  'appPublish.btn.market':'发布到云应用商店',
  'appPublish.table.publishName':'发布模版名称',
  'appPublish.table.versions':'版本号(别名)',
  'appPublish.table.scope':'发布范围',
  'appPublish.table.publishTime':'发布时间',
  'appPublish.table.status':'状态',
  'appPublish.table.operate':'操作',
  'appPublish.table.btn.delete':'删除',
  'appPublish.table.btn.continue':'继续发布',
  'appPublish.table.btn.cancel':'取消发布',
}

//备份
const appBackups = {
  'appBackups.title':'备份管理',
  'appBackups.desc':'应用备份是指将当前应用元数据、持久化数据、版本数据完整备份，备份记录可用于应用迁移和回滚，云端备份记录可用于跨集群应用迁移操作',
  'appBackups.btn.addBackups':'新增备份',
  'appBackups.btn.importBackups':'导入备份',
  'appBackups.btn.allBackups':'团队全部备份',
  'appBackups.table.backupsTime':'备份时间',
  'appBackups.table.backupsPerson':'备份人',
  'appBackups.table.backupsPattern':'备份模式',
  'appBackups.table.packetSize':'包大小',
  'appBackups.table.status':'状态',
  'appBackups.table.comment':'备注',
  'appBackups.table.operate':'操作',
  'appBackups.table.btn.recover':'恢复',
  'appBackups.table.btn.removal':'迁移',
  'appBackups.table.btn.export':'导出',
  'appBackups.table.btn.delete':'删除',

}

//网关
const appGateway = {
  'appGateway.title':'网关访问策略管理',
  'appGateway.desc':'访问策略是指从集群外访问组件的方式，包括使用HTTP域名访问或IP+Port(TCP/UDP)访问，这里仅管理当前应用下的所有组件的访问策略',
  'appGateway.placeholder':'搜索域名/组件',
  'appGateway.btn.search':'搜索',
  'appGateway.btn.add':'添加策略',
  'appGateway.table.domain':'域名',
  'appGateway.table.type':'类型',
  'appGateway.table.route':'高级路由',
  'appGateway.table.certificate':'证书',
  'appGateway.table.app':'应用',
  'appGateway.table.port':'组件端口',
  'appGateway.table.operate':'操作',
  'appGateway.table.config':'参数配置',
  'appGateway.table.edit':'编辑',
  'appGateway.table.delete':'删除',
}

//升级
const appUpgrade = {
  'appUpgrade.title':'升级管理',
  'appUpgrade.desc':'当前应用内具有从应用市场或应用商店安装而来的组件时，升级管理功能可用。若安装源的应用版本有变更则可以进行升级操作',
  'appUpgrade.tabs.list':'应用模型列表',
  'appUpgrade.current_version':'当前版本',
  'appUpgrade.Upgradable_version':'可升级版本',
  'appUpgrade.btn.upgrade':'升级',
  'appUpgrade.btn.addon':'查看组件',
  'appUpgrade.tabs.record':'升级记录',
  'appUpgrade.table.createTime':'创建时间',
  'appUpgrade.table.app':'应用模版名称',
  'appUpgrade.table.versions':'版本',
  'appUpgrade.table.status':'状态',
  'appUpgrade.table.operate':'操作',
}

//配置
const appConfiguration = {
  'appConfiguration.title':'应用配置组管理',
  'appConfiguration.desc':'配置组是通过环境变量注入到当前应用指定的组件运行环境中',
  'appConfiguration.placeholder':'搜索配置组名称',
  'appConfiguration.btn.search':'搜索',
  'appConfiguration.btn.add':'添加配置组',
  'appConfiguration.table.name':'配置组名称',
  'appConfiguration.table.createTime':'创建时间',
  'appConfiguration.table.componentNum':'生效组件数',
  'appConfiguration.table.status':'生效状态',
  'appConfiguration.table.operate':'操作',
  'appConfiguration.table.btn.edit':'编辑',
  'appConfiguration.table.btn.delete':'删除',
}

//k8s资源
const addKubenetesResource = {
  'addKubenetesResource.title': 'K8s 资源管理',
  'addKubenetesResource.desc': '此处管理直接通过 Yaml 文件部署到 Kubernetes 集群中的资源。',
  'addKubenetesResource.table.name': '资源名称',
  'addKubenetesResource.table.type': '资源类型',
  'addKubenetesResource.table.status': '状态',
  'addKubenetesResource.table.operate': '操作',
  'addKubenetesResource.table.btn.check': '查看',
  'addKubenetesResource.table.btn.edit': '编辑',
  'addKubenetesResource.table.btn.delete': '删除',
  'addKubenetesResource.table.success': '创建成功',
  'addKubenetesResource.table.error': '创建失败',
  'addKubenetesResource.table.checkDetail': '查看详情',
}

//动态
const appDynamic = {
  'appDynamic.title':'动态',
  'appDynamic.desc':'跟踪账号操作记录的查询，可用于安全分析、资源变更追踪以及合规性审计等场景。',
  'appDynamic.table.user':'用户',
  'appDynamic.table.componentName':'组件名称',
  'appDynamic.table.operateTime':'操作时间',
  'appDynamic.table.operateContent':'操作内容',
  'appDynamic.table.operateDetail':'操作详情',
  'appDynamic.table.checkDetail':'查看详情',
  'appDynamic.btn.inquire':'查询',
}
export default Object.assign({}, appOverview, appPublish, appBackups, appConfiguration, appUpgrade, appConfiguration, addKubenetesResource, appDynamic);