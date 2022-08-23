//企业下信息
    //总览
    const enterpriseOverview = {
        // 企业信息
        'enterpriseOverview.information.message':'Enterprise information',
        'enterpriseOverview.information.name':'Enterprise name:',
        'enterpriseOverview.information.serve':'Understand enterprise services',
        'enterpriseOverview.information.unite':'Federated cloud ID',
        'enterpriseOverview.information.versions':'Platform version',
        'enterpriseOverview.information.time':'Creation time',
        // 应用数量
        'enterpriseOverview.app.number':'Number of applications',
        'enterpriseOverview.app.overview':'{number} Applications in total',
        'enterpriseOverview.app.run':'Application in operation',
        'enterpriseOverview.app.notrun':'App not running',
        // 组件数量
        'enterpriseOverview.module.number':'Number of components',
        'enterpriseOverview.module.notrun':'Not running',
        'enterpriseOverview.module.run':'In operation',
        'enterpriseOverview.module.notrun.component':'Component not running',
        'enterpriseOverview.module.run.component':'Running components',
        // 团队
        'enterpriseOverview.team.group':'Team',
        'enterpriseOverview.team.frequently':'Common teams',
        'enterpriseOverview.team.more':'More',
        'enterpriseOverview.team.new':'New team:',
        'enterpriseOverview.team.join':'Join the team',
        'enterpriseOverview.team.setup':'Create team',
        // 右下角总览
        'enterpriseOverview.overview.template':'Number of application templates',
        'enterpriseOverview.overview.team':'Number of teams',
        'enterpriseOverview.overview.user':'Number of users',
        'enterpriseOverview.overview.colony':'Number of clusters',
        'enterpriseOverview.overview.memory':'Memory usage / total',
        'enterpriseOverview.overview.cpu':'CPU usage / total',
        'enterpriseOverview.overview.tooltip':'{num}{unit}Including the memory usage, system usage and platform component usage of each team',
        'enterpriseOverview.overview.entrance':'Convenient entrance',
        'enterpriseOverview.overview.edit':'Edit',
        'enterpriseOverview.overview.add':'Newly added',

    }
    //应用市场
    const applicationMarket = {
        // PageHeaderLayout
        'applicationMarket.pageHeaderLayout.title':'Application market management',
        'applicationMarket.PageHeaderLayout.content':'The app market supports the docking and management of rainstore app store and helm app store',
        // 本地组件库tabs
        'applicationMarket.localMarket.title':'Local component library',
        'applicationMarket.localMarket.placeholder':'Please enter a name to search',
        'applicationMarket.localMarket.radioValue.enterprise':'Enterprise',
        'applicationMarket.localMarket.radioValue.team':'Team',
        'applicationMarket.localMarket.checkboxValue.more':'More labels',
        'applicationMarket.localMarket.import':'Offline import',
        'applicationMarket.localMarket.setup':'Create application template',
        // 三个点
        'applicationMarket.localMarket.delete.template':'Delete application template',
        'applicationMarket.localMarket.import.template':'Import application template',
        'applicationMarket.localMarket.edit.template':'Edit application template',
        //本地组件库为空
        'applicationMarket.localMarket.nothing.msg':'There is no application template currently, please select a method to add',
        // 本地组件库有值
        'applicationMarket.localMarket.have.title':'Install application',
        'applicationMarket.localMarket.have.desc':'Installing apps from the app store is the easiest way to deploy apps. Later, you can also easily publish your enterprise apps to the app store',
        'applicationMarket.localMarket.have.installNumber':'Installation quantity',
        'applicationMarket.localMarket.have.versions':'No version',
        'applicationMarket.localMarket.have.install':'Install',
        // 开源商店tabs
        'applicationMarket.cloudMarket.msg':'The market has been connected normally, and the platform has',
        'applicationMarket.cloudMarket.msgs':'Application permission',
        // 添加应用商店
        'applicationMarket.addMarket.tooltip.title':'Add app Market',
    }
    // 团队项目
    const enterpriseTeamManagement = {

        //PageHeaderLayout
        'enterpriseTeamManagement.PageHeaderLayout.title':'My project / Team',
        'enterpriseTeamManagement.PageHeaderLayout.title.admin':'Project / Team management',
        'enterpriseTeamManagement.PageHeaderLayout.context':'Project / Team is a level of multi tenant resource division under the enterprise. Applications, plug-ins and permission division are all isolated based on the project / team. A project / team can open multiple clusters.',
        //全部项目/团队
        'enterpriseTeamManagement.allProject.lable':'All projects / teams',
        'enterpriseTeamManagement.allProject.search':'Please enter project / Team name to search',
        'enterpriseTeamManagement.allProject.button.setup':'Create project / Team',
        'enterpriseTeamManagement.allProject.button.join':'Join project / Team',
        // th 表头
        'enterpriseTeamManagement.table.teamName':'Project / Team name',
        'enterpriseTeamManagement.table.Administrator':'Administrators',
        'enterpriseTeamManagement.table.number':'Number',
        'enterpriseTeamManagement.table.colony':'Colony',
        'enterpriseTeamManagement.table.memory':'Memory usage (MB)',
        'enterpriseTeamManagement.table.CUP':'CPU Usage',
        'enterpriseTeamManagement.table.quota':'Tenant quota (MB)',
        'enterpriseTeamManagement.table.operation':'Number of running applications',
        'enterpriseTeamManagement.table.handle':'Operation',
        // td 表体
        'enterpriseTeamManagement.table.td.role':'Role',
        'enterpriseTeamManagement.table.td.status':'State',
        // 操作三个小点
        // 普通
        'enterpriseTeamManagement.handle.quit':'Exit project / Team',
        'enterpriseTeamManagement.handle.backout':'Withdrawal application',
        // 管理员
        'enterpriseTeamManagement.admin.handle.turnoff':'Close all components',
        'enterpriseTeamManagement.admin.handle.open':'Open cluster',
        'enterpriseTeamManagement.admin.handle.delete':'Delete project / Team',
        // 其他
        'enterpriseTeamManagement.other.examine':'Applying to join the project / Team for approval',
        'enterpriseTeamManagement.other.haveNewJoinTeam':'Newly joined project / Team',
        'enterpriseTeamManagement.other.description':'There is no project / Team, please click create project / team to create',

    }
    // 集群
    const enterpriseColony = {
        // PageHeaderLayout
        'enterpriseColony.PageHeaderLayout.title':'Cluster management',
        'enterpriseColony.PageHeaderLayout.content':'Cluster is a collection of resources. Based on kubernetes cluster, deploying platform region service can become platform cluster resources',
        //添加按钮
        'enterpriseColony.button.text':"Add cluster",
        //table中td内容
        'table.tr.name':'Name',
        'table.tr.status':'State',
        'table.tr.memory':'Memory(GB)',
        'table.tr.versions':'Version',
        'table.tr.handle':'Operation',
        'table.tr.wayToInstall':'Installation method',
        'table.tr.belongToTeam':'Team',
        'table.tr.useMemory':'Memory usage(MB)',
        'table.tr.useCUP':'CPUUsage',
        'table.tr.quota':'Tenant quota(MB)',
        'table.tr.runModule':'Number of running components',
        // 安装方式
        'enterpriseColony.table.custom':'Build by oneself Kubernetes',
        'enterpriseColony.table.rke':'Self built based on host',
        'enterpriseColony.table.rke.tooltip':'Support node configuration',
        'enterpriseColony.table.helm':'Helm docking',
        'enterpriseColony.table.other':'Direct docking',
        // 状态
        'enterpriseColony.table.state.err':'Abnormal communication',
        'enterpriseColony.table.state.edit':'Editing',
        'enterpriseColony.table.state.run':'In operation',
        'enterpriseColony.table.state.down':'Offline',
        'enterpriseColony.table.state.maintain':'Under maintenance',
        'enterpriseColony.table.state.abnormal':'Abnormal',
        'enterpriseColony.table.state.unknown':'Unknown',
        // 操作
        'enterpriseColony.table.handle.delete':'Delete',
        'enterpriseColony.table.handle.edit':'Edit',
        'enterpriseColony.table.handle.quota':'Resource limit',
        'enterpriseColony.table.handle.import':'Import',
        'enterpriseColony.table.handle.deploy':'Node configuration',
        // guideStep变量控制
        'enterpriseColony.guideStep.title':'Go to add cluster',
        'enterpriseColony.guideStep.desc':'It supports adding multiple computing clusters. Please follow the wizard to add the first cluster',
        // Alert
        'enterpriseColony.alert.message':'Be careful! Cluster memory usage refers to the overall usage of the current cluster, which is generally greater than the total memory usage of the tenants',
    }
    // 用户
    const enterpriseUser = {
        // PageHeaderLayout
        'enterpriseUser.PageHeaderLayout.title':'User management ',
        'enterpriseUser.PageHeaderLayout.content':'Enterprise users query, add and modify related functions. When users need to operate application or component related resources, they need to assign them to corresponding teams',
        // 新增用户
        'enterpriseUser.button.adduser':'New user',
        //表格
        'enterpriseUser.table.userName':'User name',
        'enterpriseUser.table.name':'Full name',
        'enterpriseUser.table.phone':'Telephone',
        'enterpriseUser.table.email':'Mailbox',
        'enterpriseUser.table.time':'Creation time',
        'enterpriseUser.table.handle':'Operation',
    }
    // 设置
    const enterpriseSetting = {
        // PageHeaderLayout
        'enterpriseSetting.PageHeaderLayout.title':'Enterprise settings',
        'enterpriseSetting.PageHeaderLayout.content':'Support enterprise setting functions such as user registration and oauth2.0 integration. More abundant enterprise management resource management functions are provided in the enterprise resource management platform',
        // tabs>TabPane
        'enterpriseSetting.TabPane.basicsSetting':'Basic settings',
        'enterpriseSetting.TabPane.enterpriseAdmin':'Enterprise administrator management',
        'enterpriseSetting.TabPane.dataBackups':'Data backup',
        // tabs>TabPane>basicsSetting
        'enterpriseSetting.basicsSetting.login.title':'User registration',
        'enterpriseSetting.basicsSetting.login.content':'Controls whether users can register functions.',
        'enterpriseSetting.basicsSetting.certificate.title':'Automatic certificate issuance',
        'enterpriseSetting.basicsSetting.certificate.content':'This is an external extension function to realize the automatic issuance of certificates required by gateway policies.',
        'enterpriseSetting.basicsSetting.serve.title':'Oauth Third party service integration',
        'enterpriseSetting.basicsSetting.serve.content':'Support GitHub, gitlab, code cloud and other third-party OAuth services. Users can obtain warehouse projects after interconnection. Support the third-party login authentication of Dingding, aliyun and other services.',
        'enterpriseSetting.basicsSetting.mirroring.title':'Internal component library image warehouse',
        'enterpriseSetting.basicsSetting.mirroring.content':'It is used to store the application model image published to the component library, which needs to be accessible by all clusters.',
        'enterpriseSetting.basicsSetting.storage.title':'Object storage',
        'enterpriseSetting.basicsSetting.storage.content':'Object storage is used for cloud backup functions and stores backup files of applications.',
        'enterpriseSetting.basicsSetting.monitoring.title':'Monitor',
        'enterpriseSetting.basicsSetting.monitoring.content':'Used to monitor: cluster, node, component and service data.',
        'enterpriseSetting.basicsSetting.basicInformation.title':'Basic information',
        'enterpriseSetting.basicsSetting.basicInformation.content':'You can modify the title, enterprise name, logo and page icon of the website.',
        'enterpriseSetting.basicsSetting.checkTheConfiguration':'View configuration',
        // tabs>TabPane>enterpriseAdmin
        'enterpriseSetting.enterpriseAdmin.col.designation':'Name',
        'enterpriseSetting.enterpriseAdmin.col.name':'Full name',
        'enterpriseSetting.enterpriseAdmin.col.role':'Role',
        'enterpriseSetting.enterpriseAdmin.col.time':'Time',
        'enterpriseSetting.enterpriseAdmin.col.Menu.delete':'Delete administrator',
        'enterpriseSetting.enterpriseAdmin.col.Menu.edit':'Edit administrator',
        'enterpriseSetting.enterpriseAdmin.col.time.add':'Add administrator',
        // tabs>TabPane>BackupManage
        'enterpriseSetting.BackupManage.button.importBackups':'Import backup',
        'enterpriseSetting.BackupManage.button.addBackups':'Add backup',
        'enterpriseSetting.BackupManage.table.backupFile':'Backup files',
        'enterpriseSetting.BackupManage.table.size':'Size',
        'enterpriseSetting.BackupManage.table.handle':'Operation',
        'enterpriseSetting.BackupManage.table.handle.delete':'Delete',
        'enterpriseSetting.BackupManage.table.handle.install':'Install',
        'enterpriseSetting.BackupManage.table.handle.recover':'Recovery',
        'enterpriseSetting.BackupManage.alert.message':'Data backup and recovery are applicable to data migration scenarios, for example, you need to migrate and deploy the console.',
    }

  

export default Object.assign({}, enterpriseOverview,applicationMarket,enterpriseTeamManagement,enterpriseColony,enterpriseUser,enterpriseSetting);