// 位置：utils > global 组件运行状态翻译

const global = {
    // fetchStateText 函数下的变量
    'global.fetchStateText.RUNNING':'运行中',
    'global.fetchStateText.running':'运行中',
    'global.fetchStateText.starting':'启动中',
    'global.fetchStateText.checking':'检测中',
    'global.fetchStateText.stopping':'关闭中',
    'global.fetchStateText.unusual':'运行异常',
    'global.fetchStateText.closed':'已关闭',
    'global.fetchStateText.undeploy':'未部署',
    'global.fetchStateText.unKnow':'未知',
    'global.fetchStateText.UNKNOWN':'未知',
    'global.fetchStateText.ABNORMAL':'运行异常',
    'global.fetchStateText.TEMINATING':'关闭中',
    'global.fetchStateText.INITIATING':'等待启动',
    'global.fetchStateText.SCHEDULING':'调度中',
    'global.fetchStateText.TheInternet':'未知',
    'global.fetchStateText.upgrade':'升级中',
    'global.fetchStateText.creating':'部署中',
    'global.fetchStateText.expired':'过期',
    'global.fetchStateText.NOTREADY':'未就绪',
    'global.fetchStateText.UNHEALTHY':'不健康',
    'global.fetchStateText.succeeded':'已完成',
    'global.fetchStateText.failed':'执行失败',
    'global.fetchStateText.SUCCEEDED':'已完成',

    // fetchGovernanceMode
    'global.fetchGovernanceMode.KUBERNETES_NATIVE_SERVICE':'原生 service 模式',
    'global.fetchGovernanceMode.BUILD_IN_SERVICE_MESH':'内置 ServiceMesh 模式',
    'global.fetchGovernanceMode.ISTIO_SERVICE_MESH':'Istio治理模式',

    // fetchTime
    'global.fetchTime.day':'{num}天',
    'global.fetchTime.hour':'{num}小时',
    'global.fetchTime.minute':'{num}分钟',
    'global.fetchTime.second':'{num}秒',
    'global.fetchTime.second.one':'1秒',
    'global.fetchTime.day.ago':'{num}天前',
    'global.fetchTime.hour.ago':'{num}小时前',
    'global.fetchTime.minute.ago':'{num}分钟前',
    'global.fetchTime.second.ago':'{num}秒前',
    'global.fetchTime.second.ago.one':'1秒前',

    // fetchInstanceReasons
    'global.fetchInstanceReasons.UnknownContainerStatuses':'未知的容器状态',
    'global.fetchInstanceReasons.ContainersNotReady':'容器未就绪',
    'global.fetchInstanceReasons.ContainersNotInitialized':'容器尚未初始化',

    // fetchInstanceAdvice
    'global.fetchInstanceAdvice.OutOfMemory':'内存不足, 建议为程序分配更多内存, 或检查程序是否合理使用内存',
    'global.fetchInstanceAdvice.Unhealthy':'健康检测不通过, 请检查程序的端口是否可用, 以及健康检测配置是否正确',
    'global.fetchInstanceAdvice.Initiating':'等待启动中, 请检查该组件所依赖的组件是否已经正常启动',

    // fetchOperation
    'global.fetchOperation.doing':'进行中',
    'global.fetchOperation.timeOut':'操作已超时',
    'global.fetchOperation.success':'成功',
    'global.fetchOperation.lose':'失败',

    // fetchReason
    'global.fetchReason.tenant_lack_of_memory':'超过租户限额',
    'global.fetchReason.cluster_lack_of_memory':'集群资源不足',

    // fetchAccessText
    'global.fetchReason.component':'组件管理',
    'global.fetchReason.app':'应用管理',
    'global.fetchReason.gatewayRule':'网关访问策略',
    'global.fetchReason.certificate':'证书管理',
    'global.fetchReason.plugin':'插件管理',
    'global.fetchReason.teamMember':'团队成员管理',
    'global.fetchReason.teamRole':'团队角色管理',
    'global.fetchReason.teamRegion':'团队集群管理',

    // getComponentType
    'global.getComponentType.stateless_multiple':'无状态服务(Deployment类型)',
    'global.getComponentType.state_singleton':'有状态服务(Statefulset类型)',
    'global.getComponentType.stateless_singleton':'无状态服务(Deployment类型)',
    'global.getComponentType.state_multiple':'有状态服务(Statefulset类型)',
    'global.getComponentType.job':'任务(Job类型)',
    'global.getComponentType.cronjob':'周期性任务(Cronjob类型)',

    // getSupportComponentTyps
    'global.getSupportComponentTyps.stateless_multiple':'部署为无状态服务(Deployment类型),一般用于Web类、API类等组件。',
    'global.getSupportComponentTyps.state_multiple':'部署为有状态服务(Statefulset类型),一般用于DB类、消息中间件类、数据类组件。',
    'global.getSupportComponentTyps.job':'部署为任务(Job类型),一般用于一次性任务,完成后容器就退出。',
    'global.getSupportComponentTyps.cronjob':'部署为周期性任务(Cronjob类型),一般用于处理周期性的、需反复执行的定时任务。',



    
}