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
        // applicationMarket>AuthCompany
        'applicationMarket.AuthCompany.title':'欢迎使用该平台，请先完成连接云应用商店授权',
        'applicationMarket.AuthCompany.Not_available':'应用市场不可用，请检查应用市场地址，或联系应用市场的管理员',
        'applicationMarket.AuthCompany.authentication':'企业尚未绑定云端应用商店, 按以下步骤进行绑定认证',
        'applicationMarket.AuthCompany.Accessing':'正在访问',
        'applicationMarket.AuthCompany.store':'云应用商店',
        'applicationMarket.AuthCompany.grant':'进行用户授权，完成后可获取安装应用的权限。',
        'applicationMarket.AuthCompany.RainStore':'RainStore商店',
        'applicationMarket.AuthCompany.Helm':'Helm商店',
        'applicationMarket.AuthCompany.market':'请先进行应用市场认证',
        'applicationMarket.AuthCompany.go_authentication':'去认证',
        'applicationMarket.AuthCompany.url':'请填写需要进行绑定的应用市场的URL',
        'applicationMarket.AuthCompany.max':'最大长度255位',
        'applicationMarket.AuthCompany.next':'下一步',
        'applicationMarket.AuthCompany.success':'认证成功，选择需要绑定的商店',
        'applicationMarket.AuthCompany.choice':'请选择需要绑定的商店',
        'applicationMarket.AuthCompany.binding':'绑定',
        // // applicationMarket>TagList
        // 'applicationMarket.TagList.':'',
        // 'applicationMarket.TagList.':'',
        // // applicationMarket>CreateAppModels
        // 'applicationMarket.CreateAppModels.':'',
        // // applicationMarket>CreateHelmAppModels
        // 'applicationMarket.CreateHelmAppModels.':'',
        // // applicationMarket>CreateAppMarket
        // 'applicationMarket.CreateAppMarket.':'',
        // // applicationMarket>HelmAppMarket
        // 'applicationMarket.HelmAppMarket.':''
        // // applicationMarket>DeleteApp
        // 'applicationMarket.DeleteApp':'',

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
        'enterpriseColony.button.edit':"编辑集群",
        'enterpriseColony.title':"集群",
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
        //导入
        'enterpriseColony.import.title':'导入资源',
        'enterpriseColony.import.list.title':'资源列表：',
        'enterpriseColony.import.app.title':'未分组',
        'enterpriseColony.import.unidentification.list.title':'未识别列表：',
        'enterpriseColony.import.unidentification.cause':'未识别原因:',
        'enterpriseColony.import.unidentification.file':'未识别文件:',
        'enterpriseColony.import.recognition.title':'团队名称：:',
        'enterpriseColony.import.recognition.null':'暂无团队:',
        'enterpriseColony.import.recognition.app.title':'应用列表::',
        'enterpriseColony.import.recognition.tabs':'k8s资源',
        'enterpriseColony.import.recognition.tabs.deploy':'部署属性:',
        'enterpriseColony.import.recognition.tabs.deploy.type':'组件类型:',
        'enterpriseColony.import.recognition.tabs.deploy.instance':'实例数:',
        'enterpriseColony.import.recognition.tabs.deploy.memory':'内存:',
        'enterpriseColony.import.recognition.tabs.deploy.cpu':'CPU:',
        'enterpriseColony.import.recognition.tabs.deploy.unlimited':'无限制',
        'enterpriseColony.import.recognition.tabs.port':'端口管理:',
        'enterpriseColony.import.recognition.tabs.port.port_number':'端口号',
        'enterpriseColony.import.recognition.tabs.port.agreement':'端口协议',
        'enterpriseColony.import.recognition.tabs.port.message':'服务信息',
        'enterpriseColony.import.recognition.tabs.port.internal':'对内服务',
        'enterpriseColony.import.recognition.tabs.port.address':'访问地址',
        'enterpriseColony.import.recognition.tabs.port.foreign':'对外服务',
        'enterpriseColony.import.recognition.tabs.env':'环境变量',
        'enterpriseColony.import.recognition.tabs.env.env_key':'变量名',
        'enterpriseColony.import.recognition.tabs.env.env_value':'变量值',
        'enterpriseColony.import.recognition.tabs.env.env_explain':'说明',
        'enterpriseColony.import.recognition.tabs.configFiles':'配置文件',
        'enterpriseColony.import.recognition.tabs.configFiles.config_name':'配置文件名称',
        'enterpriseColony.import.recognition.tabs.configFiles.config_path':'配置文件挂载路径',
        'enterpriseColony.import.recognition.tabs.configFiles.mode':'权限',
        'enterpriseColony.import.recognition.tabs.flex':'自动伸缩',
        'enterpriseColony.import.recognition.tabs.flex.switch':'功能开关',
        'enterpriseColony.import.recognition.tabs.flex.minSize':'最小实例',
        'enterpriseColony.import.recognition.tabs.flex.maxSize':'最大实例',
        'enterpriseColony.import.recognition.tabs.flex.cpuUsage':'cpu使用率',
        'enterpriseColony.import.recognition.tabs.flex.memoryUsage':'内存使用率',
        'enterpriseColony.import.recognition.tabs.flex.cpuAmount':'cpu使用量',
        'enterpriseColony.import.recognition.tabs.flex.memoryAmount':'内存使用量',
        'enterpriseColony.import.recognition.tabs.health':'健康监测',
        'enterpriseColony.import.recognition.tabs.health.status':'当前状态:',
        'enterpriseColony.import.recognition.tabs.health.check':'检测方式:',
        'enterpriseColony.import.recognition.tabs.health.notHealth':'不健康处理方式:',
        'enterpriseColony.import.recognition.tabs.health.start':'启动',
        'enterpriseColony.import.recognition.tabs.health.null':'暂无状态',
        'enterpriseColony.import.recognition.tabs.health.notSetting':'未设置',
        'enterpriseColony.import.recognition.tabs.health.restart':'重启',
        'enterpriseColony.import.recognition.tabs.health.offLine':'下线',
        'enterpriseColony.import.recognition.tabs.specialAttr':'特殊属性',
        'enterpriseColony.import.recognition.tabs.specialAttr.btn.detail':'查看详情',
        'enterpriseColony.import.recognition.tabs.specialAttr.desc':'该配置以yaml文件形式存储,请点击右侧按钮查看详情。',
        'enterpriseColony.import.recognition.tabs.k8s.name':'名称',
        'enterpriseColony.import.recognition.tabs.k8s.kind':'类型',
        'enterpriseColony.import.recognition.tabs.k8s.content':'yaml',
        'enterpriseColony.import.recognition.tabs.k8s.name_null':'暂无名称',
        'enterpriseColony.import.recognition.tabs.k8s.not_kind':'未分类',
        'enterpriseColony.table.handle.quota.title':'租户资源占用排行',
        'enterpriseColony.table.handle.quota.alert':'正在设置 {limitTeamName} 在 {regionAlias} 集群的内存限额',
        'enterpriseColony.table.handle.quota.form.label.limit_memory':'内存限额(MB)',
        'enterpriseColony.table.handle.quota.form.label.alert':'CPU 使用量 1000 相当于分配1核 CPU',
        'enterpriseColony.table.handle.quota.table.label.team_name':'所属团队',
        'enterpriseColony.table.handle.quota.table.label.memory_request':'内存使用量(MB)',
        'enterpriseColony.table.handle.quota.table.label.cpu_request':'CPU使用量',
        'enterpriseColony.table.handle.quota.table.label.set_limit_memory':'租户限额(MB)',
        'enterpriseColony.table.handle.quota.table.label.running_app_num':'运行组件数',
        'enterpriseColony.table.handle.quota.table.label.method':'操作',
        'enterpriseColony.table.handle.quota.table.label.method.btn':'设置限额',
        // 编辑
        'enterpriseColony.edit.alert':'集群连接失败，请确认配置是否正确',
        'enterpriseColony.edit.form.label.region_name':'集群ID',
        'enterpriseColony.edit.form.label.region_alias':'集群名称',
        'enterpriseColony.edit.form.label.url':'API地址',
        'enterpriseColony.edit.form.label.wsurl':'WebSocket通信地址',
        'enterpriseColony.edit.form.label.httpdomain':'HTTP应用默认域名后缀',
        'enterpriseColony.edit.form.label.tcpdomain':'TCP应用默认访问IP',
        'enterpriseColony.edit.form.label.ssl_ca_cert':'API-CA证书',
        'enterpriseColony.edit.form.label.cert_file':'API-Client证书',
        'enterpriseColony.edit.form.label.key_file':'API-Client证书密钥',
        'enterpriseColony.edit.form.label.desc':'API-备注',
    }
    // 用户
    const enterpriseUser = {
        // PageHeaderLayout
        'enterpriseUser.PageHeaderLayout.title':'用户管理',
        'enterpriseUser.PageHeaderLayout.content':'企业用户查询、添加和修改相关功能，用户需要操作应用或组件相关资源时需要将其分配到相应的团队',
        // 新增用户
        'enterpriseUser.button.adduser':'新增用户',
        'enterpriseUser.button.edituser':'编辑用户',
        //表格
        'enterpriseUser.table.userName':'用户名称',
        'enterpriseUser.table.name':'姓名',
        'enterpriseUser.table.phone':'电话',
        'enterpriseUser.table.email':'邮箱',
        'enterpriseUser.table.time':'创建时间',
        'enterpriseUser.table.userName':'用户名称',
        //表单
        'enterpriseUser.form.label.user_name':'用户名',
        'enterpriseUser.form.label.real_name':'姓名',
        'enterpriseUser.form.label.password':'密码',
        'enterpriseUser.form.label.email':'邮箱',
        'enterpriseUser.form.label.phone':'电话',
        'enterpriseUser.form.label.new_password':'设置新密码',
        'enterpriseUser.form.label.tenant_name':'所属团队',
        'enterpriseUser.form.label.role_ids':'角色权限',
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
        'enterpriseSetting.basicsSetting.Modal.title':'开通自动签发证书',
        'enterpriseSetting.basicsSetting.Modal.label':'扩展配置',
        'enterpriseSetting.basicsSetting.Modal.label.msg':'扩展配置是必须的',
        'enterpriseSetting.basicsSetting.serve.Modal.title':'OAuth 第三方服务集成配置',
        'enterpriseSetting.basicsSetting.serve.Modal.alert':'服务已开启自动登录，登录流程将自动导航到该服务。',
        'enterpriseSetting.basicsSetting.serve.Modal.table.oauth_type':'OAuth类型',
        'enterpriseSetting.basicsSetting.serve.Modal.table.name':'名称',
        'enterpriseSetting.basicsSetting.serve.Modal.table.client_id':'客户端ID',
        'enterpriseSetting.basicsSetting.serve.Modal.table.client_secret':'客户端密钥',
        'enterpriseSetting.basicsSetting.serve.Modal.table.home_url':'服务地址',
        'enterpriseSetting.basicsSetting.serve.Modal.table.action':'操作',
        'enterpriseSetting.basicsSetting.serve.Modal.table.del':'删除',
        'enterpriseSetting.basicsSetting.serve.Modal.table.edit':'编辑',
        'enterpriseSetting.basicsSetting.serve.Modal.table.disable':'禁用',
        'enterpriseSetting.basicsSetting.serve.Modal.table.enabled':'启用',
        'enterpriseSetting.basicsSetting.serve.form.title.add':'添加 Oauth 第三方服务',
        'enterpriseSetting.basicsSetting.serve.form.title.edit':'编辑第三方服务配置',
        'enterpriseSetting.basicsSetting.serve.form.label.oauth_type':'OAuth类型',
        'enterpriseSetting.basicsSetting.serve.form.label.name':'名称',
        'enterpriseSetting.basicsSetting.serve.form.label.home_url':'服务地址',
        'enterpriseSetting.basicsSetting.serve.form.label.client_id':'客户端ID',
        'enterpriseSetting.basicsSetting.serve.form.label.client_secret':'客户端密钥',
        'enterpriseSetting.basicsSetting.serve.form.label.redirect_domain':'回调地址',
        'enterpriseSetting.basicsSetting.serve.form.label.is_auto_login':'自动登录',
        'enterpriseSetting.basicsSetting.serve.form.label.oauth_type.desc':'如需编辑类型，请删除配置后重新添加',
        'enterpriseSetting.basicsSetting.serve.form.label.name.desc':'OAuth服务显示名称',
        'enterpriseSetting.basicsSetting.serve.form.label.home_url.desc':'第三方服务访问地址',
        'enterpriseSetting.basicsSetting.serve.form.label.client_id.desc':'Client ID',
        'enterpriseSetting.basicsSetting.serve.form.label.client_secret.desc':'Client Secret',
        'enterpriseSetting.basicsSetting.serve.form.label.redirect_domain.desc':'回调地址是用于 OAuth认证完回跳时的访问地址，默认填充为当前访问地址。通常也需要您在Oauth 服务提供商进行相同的配置。',
        'enterpriseSetting.basicsSetting.serve.form.label.is_auto_login.desc':'开启自动登录即需要登录时将自动跳转到该Oauth服务进行认证，实现单点登录效果，未确认该服务可用之前请谨慎开启。',
        'enterpriseSetting.basicsSetting.mirroring.modal.title':'开通组件库镜像仓库',
        'enterpriseSetting.basicsSetting.mirroring.modal.comp_title':'组件库镜像仓库',
        'enterpriseSetting.basicsSetting.mirroring.form.label.hub_url':'仓库地址',
        'enterpriseSetting.basicsSetting.mirroring.form.label.namespace':'命名空间',
        'enterpriseSetting.basicsSetting.mirroring.form.label.hub_user':'用户名',
        'enterpriseSetting.basicsSetting.mirroring.form.label.hub_password':'密码',
        'enterpriseSetting.basicsSetting.storage.modal.title':'配置云端备份对象存储',
        'enterpriseSetting.basicsSetting.storage.form.label.provider':'存储类型',
        'enterpriseSetting.basicsSetting.monitoring.modal.title':'监控配置',
        'enterpriseSetting.basicsSetting.monitoring.form.label.home_url':'监控地址',
        'enterpriseSetting.basicsSetting.monitoring.form.label.cluster_monitor_suffix':'集群监控',
        'enterpriseSetting.basicsSetting.monitoring.form.label.node_monitor_suffix':'节点监控',
        'enterpriseSetting.basicsSetting.monitoring.form.label.component_monitor_suffix':'组件监控',
        'enterpriseSetting.basicsSetting.monitoring.form.label.slo_monitor_suffix':'服务监控',
        'enterpriseSetting.basicsSetting.monitoring.form.label.more':'更多高级设置',
        'enterpriseSetting.basicsSetting.basicInformation.form.label.title':'网站标题',
        'enterpriseSetting.basicsSetting.basicInformation.form.label.enterprise_alias':'企业名称',
        'enterpriseSetting.basicsSetting.basicInformation.form.label.doc_url':'文档地址',
        'enterpriseSetting.basicsSetting.basicInformation.form.label.logo':'LOGO',
        'enterpriseSetting.basicsSetting.basicInformation.form.label.favicon':'网页图标',




        // tabs>TabPane>enterpriseAdmin
        'enterpriseSetting.enterpriseAdmin.col.designation':'名称',
        'enterpriseSetting.enterpriseAdmin.col.name':'姓名',
        'enterpriseSetting.enterpriseAdmin.col.role':'角色',
        'enterpriseSetting.enterpriseAdmin.col.time':'时间',
        'enterpriseSetting.enterpriseAdmin.col.Menu.delete':'删除管理员',
        'enterpriseSetting.enterpriseAdmin.col.Menu.edit':'编辑管理员',
        'enterpriseSetting.enterpriseAdmin.col.time.add':'添加管理员',
        'enterpriseSetting.enterpriseAdmin.form.select.user_id':'用户名称',
        'enterpriseSetting.enterpriseAdmin.form.select.roles':'选择角色',
        // tabs>TabPane>BackupManage
        'enterpriseSetting.BackupManage.button.importBackups':'导入备份',
        'enterpriseSetting.BackupManage.button.addBackups':'增加备份',
        'enterpriseSetting.BackupManage.table.backupFile':'备份文件',
        'enterpriseSetting.BackupManage.table.size':'大小',
        'enterpriseSetting.BackupManage.table.handle':'操作',
        'enterpriseSetting.BackupManage.table.handle.delete':'删除',
        'enterpriseSetting.BackupManage.table.handle.install':'下载',
        'enterpriseSetting.BackupManage.table.handle.recover':'恢复',
        'enterpriseSetting.BackupManage.alert.message':'数据备份与恢复适用于数据迁移场景，比如你需要将控制台进行迁移部署。',
        'enterpriseSetting.BackupManage.importBackups.title':'确认恢复数据',
        'enterpriseSetting.BackupManage.importBackups.alert':'备份数据恢复是一个危险的操作，该操作最好用于数据跨平台迁移场景，原地还原仅做增量动作。如果确定进行，需要二次验证您的身份。',
        'enterpriseSetting.BackupManage.importBackups.form.label.password':'账号密码',


    }

  

export default Object.assign({}, enterpriseOverview,applicationMarket,enterpriseTeamManagement,enterpriseColony,enterpriseUser,enterpriseSetting);