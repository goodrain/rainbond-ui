//企业下信息
    //总览
    const enterpriseOverview = {
        // 企业信息
        'enterpriseOverview.information.message':'企业信息',
        'enterpriseOverview.information.name':'企业名称:',
        'enterpriseOverview.information.serve':'了解企业服务',
        'enterpriseOverview.information.unite':'联合云ID',
        'enterpriseOverview.information.versions':'平台版本',
        'enterpriseOverview.information.time':'创建时间',
        // 应用数量
        'enterpriseOverview.app.number':'应用数量',
        'enterpriseOverview.app.overview':'共{number}个应用数量',
        'enterpriseOverview.app.run':'运行中应用',
        'enterpriseOverview.app.notrun':'未运行应用',
        // 组件数量
        'enterpriseOverview.module.number':'组件数量',
        'enterpriseOverview.module.notrun':'未运行',
        'enterpriseOverview.module.run':'运行中',
        'enterpriseOverview.module.notrun.component':'未运行组件',
        'enterpriseOverview.module.run.component':'运行中组件',
        // 团队
        'enterpriseOverview.team.group':'团队',
        'enterpriseOverview.team.frequently':'常用团队',
        'enterpriseOverview.team.more':'更多',
        'enterpriseOverview.team.new':'新加入团队：',
        'enterpriseOverview.team.join':'加入团队',
        'enterpriseOverview.team.setup':'创建团队',
        // 右下角总览
        'enterpriseOverview.overview.template':'应用模板数量',
        'enterpriseOverview.overview.team':'团队数量',
        'enterpriseOverview.overview.user':'用户数量',
        'enterpriseOverview.overview.colony':'集群数量',
        'enterpriseOverview.overview.memory':'内存使用量/总量',
        'enterpriseOverview.overview.cpu':'CPU使用量/总量',
        'enterpriseOverview.overview.tooltip':'{num}{unit}包含各团队内存使用量、系统使用量和平台组件使用量',
        'enterpriseOverview.overview.entrance':'便捷入口',
        'enterpriseOverview.overview.edit':'编辑',
        'enterpriseOverview.overview.add':'新增',

    }
    //应用市场
    const applicationMarket = {
        // PageHeaderLayout
        'applicationMarket.pageHeaderLayout.title':'应用市场管理',
        'applicationMarket.PageHeaderLayout.content':'应用市场支持Rainstore应用商店和Helm应用商店的对接和管理',
        // 本地组件库tabs
        'applicationMarket.localMarket.title':'本地组件库',
        'applicationMarket.localMarket.placeholder':'请输入名称进行搜索',
        'applicationMarket.localMarket.radioValue.enterprise':'企业',
        'applicationMarket.localMarket.radioValue.team':'团队',
        'applicationMarket.localMarket.checkboxValue.more':'更多标签',
        'applicationMarket.localMarket.import':'离线导入',
        'applicationMarket.localMarket.setup':'创建应用模版',
        // 三个点
        'applicationMarket.localMarket.delete.template':'删除应用模板',
        'applicationMarket.localMarket.import.template':'导入应用模板',
        'applicationMarket.localMarket.edit.template':'编辑应用模板',
        //本地组件库为空
        'applicationMarket.localMarket.nothing.msg':'当前无应用模版，请选择方式添加',
        // 本地组件库有值
        'applicationMarket.localMarket.have.title':'安装应用',
        'applicationMarket.localMarket.have.desc':'从应用商店安装应用是最简单的应用部署方式，后面你也可以很方便的将您的企业应用发布到应用商店中',
        'applicationMarket.localMarket.have.installNumber':'安装量',
        'applicationMarket.localMarket.have.versions':'无版本',
        'applicationMarket.localMarket.have.install':'安装',
        // 开源商店tabs
        'applicationMarket.cloudMarket.msg':'市场已经正常连接,该平台具有',
        'applicationMarket.cloudMarket.msgs':'应用权限',
        // 添加应用商店
        'applicationMarket.addMarket.tooltip.title':'添加应用市场',
    }
    // 团队项目
    const enterpriseTeamManagement = {

        //PageHeaderLayout
        'enterpriseTeamManagement.PageHeaderLayout.title':'我的项目/团队',
        'enterpriseTeamManagement.PageHeaderLayout.title.admin':'项目/团队管理',
        'enterpriseTeamManagement.PageHeaderLayout.context':'项目/团队是企业下多租户资源划分的一个层级，应用、插件、权限划分等都基于项目/团队进行隔离。一个项目/团队可以开通多个集群。',
        //全部项目/团队
        'enterpriseTeamManagement.allProject.lable':'全部项目/团队',
        'enterpriseTeamManagement.allProject.search':'请输入项目/团队名称进行搜索',
        'enterpriseTeamManagement.allProject.button.setup':'创建 项目/团队',
        'enterpriseTeamManagement.allProject.button.join':'加入 项目/团队',
        // th 表头
        'enterpriseTeamManagement.table.teamName':'项目/团队名称',
        'enterpriseTeamManagement.table.Administrator':'管理员',
        'enterpriseTeamManagement.table.number':'人数',
        'enterpriseTeamManagement.table.colony':'集群',
        'enterpriseTeamManagement.table.memory':'内存使用量(MB)',
        'enterpriseTeamManagement.table.CUP':'CPU使用量',
        'enterpriseTeamManagement.table.quota':'租户限额(MB)',
        'enterpriseTeamManagement.table.operation':'运行应用数',
        'enterpriseTeamManagement.table.handle':'操作',
        // td 表体
        'enterpriseTeamManagement.table.td.role':'角色',
        'enterpriseTeamManagement.table.td.status':'状态',
        // 操作三个小点
        // 普通
        'enterpriseTeamManagement.handle.quit':'退出项目/团队',
        'enterpriseTeamManagement.handle.backout':'撤销申请',
        // 管理员
        'enterpriseTeamManagement.admin.handle.turnoff':'关闭所有组件',
        'enterpriseTeamManagement.admin.handle.open':'开通集群',
        'enterpriseTeamManagement.admin.handle.delete':'删除项目/团队',
        // 其他
        'enterpriseTeamManagement.other.examine':'申请加入项目/团队审批中',
        'enterpriseTeamManagement.other.haveNewJoinTeam':'最新加入项目/团队',
        'enterpriseTeamManagement.other.description':'暂无项目/团队，请点击创建项目/团队进行创建',

    }
    // 集群
    const enterpriseColony = {
        // PageHeaderLayout
        'enterpriseColony.PageHeaderLayout.title':'集群管理',
        'enterpriseColony.PageHeaderLayout.content':'集群是资源的集合，以Kubernetes集群为基础，部署平台Region服务即可成为平台集群资源。',
        //添加按钮
        'enterpriseColony.button.text':"添加集群",
        //table中td内容
        'table.tr.name':'名称',
        'table.tr.status':'状态',
        'table.tr.memory':'内存(GB)',
        'table.tr.versions':'版本',
        'table.tr.handle':'操作',
        'table.tr.wayToInstall':'安装方式',
        'table.tr.belongToTeam':'所属团队',
        'table.tr.useMemory':'内存使用量(MB)',
        'table.tr.useCUP':'CPU使用量',
        'table.tr.quota':'租户限额(MB)',
        'table.tr.runModule':'运行组件数',
        // 安装方式
        'enterpriseColony.table.custom':'自建Kubernetes',
        'enterpriseColony.table.rke':'基于主机自建',
        'enterpriseColony.table.rke.tooltip':'支持节点配置',
        'enterpriseColony.table.helm':'Helm对接',
        'enterpriseColony.table.other':'直接对接',
        // 状态
        'enterpriseColony.table.state.err':'通信异常',
        'enterpriseColony.table.state.edit':'编辑中',
        'enterpriseColony.table.state.run':'运行中',
        'enterpriseColony.table.state.down':'已下线',
        'enterpriseColony.table.state.maintain':'维护中',
        'enterpriseColony.table.state.abnormal':'异常',
        'enterpriseColony.table.state.unknown':'未知',
        // 操作
        'enterpriseColony.table.handle.delete':'删除',
        'enterpriseColony.table.handle.edit':'编辑',
        'enterpriseColony.table.handle.quota':'资源限额',
        'enterpriseColony.table.handle.import':'导入',
        'enterpriseColony.table.handle.deploy':'节点配置',
        // guideStep变量控制
        'enterpriseColony.guideStep.title':'去添加集群',
        'enterpriseColony.guideStep.desc':'支持添加多个计算集群，请按照向导进行第一个集群的添加',
        // Alert
        'enterpriseColony.alert.message':'注意！集群内存使用量是指当前集群的整体使用量，一般都大于租户内存使用量的总和',
    }
    // 用户
    const enterpriseUser = {
        // PageHeaderLayout
        'enterpriseUser.PageHeaderLayout.title':'用户管理',
        'enterpriseUser.PageHeaderLayout.content':'企业用户查询、添加和修改相关功能，用户需要操作应用或组件相关资源时需要将其分配到相应的团队',
        // 新增用户
        'enterpriseUser.button.adduser':'新增用户',
        //表格
        'enterpriseUser.table.userName':'用户名称',
        'enterpriseUser.table.name':'姓名',
        'enterpriseUser.table.phone':'电话',
        'enterpriseUser.table.email':'邮箱',
        'enterpriseUser.table.time':'创建时间',
        'enterpriseUser.table.handle':'操作',
    }
    // 设置
    const enterpriseSetting = {
        // PageHeaderLayout
        'enterpriseSetting.PageHeaderLayout.title':'企业设置',
        'enterpriseSetting.PageHeaderLayout.content':'支持用户注册、Oauth2.0集成等企业设置功能，更丰富的企业管理资源管理功能在企业资源管理平台提供',
        // tabs>TabPane
        'enterpriseSetting.TabPane.basicsSetting':'基础设置',
        'enterpriseSetting.TabPane.enterpriseAdmin':'企业管理员管理',
        'enterpriseSetting.TabPane.dataBackups':'数据备份',
        // tabs>TabPane>basicsSetting
        'enterpriseSetting.basicsSetting.login.title':'用户注册',
        'enterpriseSetting.basicsSetting.login.content':'控制用户是否可以注册功能。',
        'enterpriseSetting.basicsSetting.certificate.title':'自动签发证书',
        'enterpriseSetting.basicsSetting.certificate.content':'这是一个外部扩充功能，实现网关策略所需证书的自动签发。',
        'enterpriseSetting.basicsSetting.serve.title':'Oauth 第三方服务集成',
        'enterpriseSetting.basicsSetting.serve.content':'支持Github、Gitlab、码云等多种第三方OAuth服务，用户互联后可获取仓库项目。支持钉钉、Aliyun等服务进行第三方登录认证。',
        'enterpriseSetting.basicsSetting.mirroring.title':'内部组件库镜像仓库',
        'enterpriseSetting.basicsSetting.mirroring.content':'用于存储发布到组件库的应用模型镜像，其需要能被所有集群访问。',
        'enterpriseSetting.basicsSetting.storage.title':'对象存储',
        'enterpriseSetting.basicsSetting.storage.content':'对象存储用于云端备份功能，存储应用的备份文件。',
        'enterpriseSetting.basicsSetting.monitoring.title':'监控',
        'enterpriseSetting.basicsSetting.monitoring.content':'用于监控：集群、节点、组件、服务数据。',
        'enterpriseSetting.basicsSetting.basicInformation.title':'基础信息',
        'enterpriseSetting.basicsSetting.basicInformation.content':'可以修改网站的标题、企业名称、LOGO、网页图标。',
        'enterpriseSetting.basicsSetting.checkTheConfiguration':'查看配置',
        // tabs>TabPane>enterpriseAdmin
        'enterpriseSetting.enterpriseAdmin.col.designation':'名称',
        'enterpriseSetting.enterpriseAdmin.col.name':'姓名',
        'enterpriseSetting.enterpriseAdmin.col.role':'角色',
        'enterpriseSetting.enterpriseAdmin.col.time':'时间',
        'enterpriseSetting.enterpriseAdmin.col.Menu.delete':'删除管理员',
        'enterpriseSetting.enterpriseAdmin.col.Menu.edit':'编辑管理员',
        'enterpriseSetting.enterpriseAdmin.col.time.add':'添加管理员',
        // tabs>TabPane>BackupManage
        'enterpriseSetting.BackupManage.button.importBackups':'导入备份',
        'enterpriseSetting.BackupManage.button.addBackups':'增加备份',
        'enterpriseSetting.BackupManage.table.backupFile':'备份文件',
        'enterpriseSetting.BackupManage.table.size':'大小',
        'enterpriseSetting.BackupManage.alert.message':'数据备份与恢复适用于数据迁移场景，比如你需要将控制台进行迁移部署。',
    }

  

export default Object.assign({}, enterpriseOverview,applicationMarket,enterpriseTeamManagement,enterpriseColony,enterpriseUser,enterpriseSetting);