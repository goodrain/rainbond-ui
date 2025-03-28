// 位置：utils > global 组件运行状态翻译

const global = {
    // fetchStateText 函数下的变量
    'global.fetchStateText.RUNNING':'Running',
    'global.fetchStateText.running':'Running',
    'global.fetchStateText.starting':'Starting',
    'global.fetchStateText.checking':'Checking',
    'global.fetchStateText.stopping':'Teminating',
    'global.fetchStateText.unusual':'Abnormal',
    'global.fetchStateText.closed':'Closed',
    'global.fetchStateText.undeploy':'UnDeployed',
    'global.fetchStateText.unKnow':'Unknown',
    'global.fetchStateText.UNKNOWN':'Unknown',
    'global.fetchStateText.ABNORMAL':'Abnormal',
    'global.fetchStateText.TEMINATING':'Teminating',
    'global.fetchStateText.INITIATING':'Initiating',
    'global.fetchStateText.SCHEDULING':'Scheduling',
    'global.fetchStateText.TheInternet':'Unknown',
    'global.fetchStateText.upgrade':'Upgrading',
    'global.fetchStateText.creating':'Creating',
    'global.fetchStateText.expired':'Expired',
    'global.fetchStateText.NOTREADY':'NotReady',
    'global.fetchStateText.UNHEALTHY':'Unhealthy',
    'global.fetchStateText.succeeded':'Completed',
    'global.fetchStateText.failed':'Failed',
    'global.fetchStateText.SUCCEEDED':'Completed',

    // fetchGovernanceMode
    'global.fetchGovernanceMode.KUBERNETES_NATIVE_SERVICE':'Native Service ',
    'global.fetchGovernanceMode.BUILD_IN_SERVICE_MESH':'Built-in ServiceMesh ',
    'global.fetchGovernanceMode.ISTIO_SERVICE_MESH':'Istio Governance ',

    // fetchTime
    'global.fetchTime.day':'{num}d ',
    'global.fetchTime.hour':'{num}h ',
    'global.fetchTime.minute':'{num}m ',
    'global.fetchTime.second':'{num}s ',
    'global.fetchTime.second.one':'1s ',
    'global.fetchTime.day.ago':'{num}d ago ',
    'global.fetchTime.hour.ago':'{num}h ago ',
    'global.fetchTime.minute.ago':'{num}m ago ',
    'global.fetchTime.second.ago':'{num}s ago ',
    'global.fetchTime.second.ago.one':'1s ago ',

    // fetchInstanceReasons
    'global.fetchInstanceReasons.UnknownContainerStatuses':'Unknown container state',
    'global.fetchInstanceReasons.ContainersNotReady':'Container not ready',
    'global.fetchInstanceReasons.ContainersNotInitialized':'The container has not been initialized',

    // fetchInstanceAdvice
    'global.fetchInstanceAdvice.OutOfMemory':'Insufficient memory, it is recommended to allocate more memory for the program, or check whether the program uses memory reasonably',
    'global.fetchInstanceAdvice.Unhealthy':'The health detection fails. Please check whether the port of the program is available and whether the health detection configuration is correct',
    'global.fetchInstanceAdvice.Initiating':'Waiting for startup, please check whether the components that this component depends on have been started normally',

    // fetchOperation
    'global.fetchOperation.doing':'In progress',
    'global.fetchOperation.timeOut':'Timeout',
    'global.fetchOperation.success':'Success',
    'global.fetchOperation.lose':'Fail',

    // fetchReason
    'global.fetchReason.tenant_lack_of_memory':'Tenant quota exceeded',
    'global.fetchReason.cluster_lack_of_memory':'Insufficient cluster resources',

    // fetchAccessText
    'global.fetchAccessText.component':'Component management',
    'global.fetchAccessText.app':'Application management',
    'global.fetchAccessText.gatewayRule':'Gateway access policy',
    'global.fetchAccessText.certificate':'Certificate management',
    'global.fetchAccessText.plugin':'Plugin management',
    'global.fetchAccessText.teamMember':'Team member management',
    'global.fetchAccessText.teamRole':'Team role management',
    'global.fetchAccessText.teamRegion':'Team cluster management',

    // getComponentType
    'global.getComponentType.stateless_multiple':'Stateless service(Deployment)',
    'global.getComponentType.state_singleton':'Stateful service(Statefulset)',
    'global.getComponentType.stateless_singleton':'Stateless service(Deployment)',
    'global.getComponentType.state_multiple':'Stateful service(Statefulset)',
    'global.getComponentType.job':'Task(Job)',
    'global.getComponentType.cronjob':'Recurring tasks(Cronjob)',

    // getSupportComponentTyps
    'global.getSupportComponentTyps.stateless_multiple':'Deployed as a stateless service (Deployment), it is generally used for components such as web classes and API classes.',
    'global.getSupportComponentTyps.state_multiple':'Deployed as stateful service (Statefulset), it is generally used for DB class, message middleware class and data class components.',
    'global.getSupportComponentTyps.job':'Deployed as a task (Job), it is generally used for one-time tasks, and the container exits after completion.',
    'global.getSupportComponentTyps.cronjob':'Deployed as a periodic task (Cronjob) and is generally used to process periodic scheduled tasks that need to be executed repeatedly.',

    // fetchStateOptTypeText
    'global.fetchStateOptTypeText.deploy':'Building component',
    'global.fetchStateOptTypeText.delete':'Delete component',
    'global.fetchStateOptTypeText.HorizontalUpgrade':'Horizontal upgrade',
    'global.fetchStateOptTypeText.VerticalUpgrade':'Vertical upgrade',
    'global.fetchStateOptTypeText.create':'Create component',
    'global.fetchStateOptTypeText.callback':'Rollback',
    'global.fetchStateOptTypeText.git-change':'Code repo modification',
    'global.fetchStateOptTypeText.own_money':'Closing of arrears',
    'global.fetchStateOptTypeText.add_label':'Add label',
    'global.fetchStateOptTypeText.delete_label':'Delete label',
    'global.fetchStateOptTypeText.service_state':'Application status modification',
    'global.fetchStateOptTypeText.reboot':'Restart components',
    'global.fetchStateOptTypeText.market_sync':'Market synchronization',
    'global.fetchStateOptTypeText.truncate':'Delete component',
    'global.fetchStateOptTypeText.EventTypeAbnormalExited':'Component exited abnormally',
    'global.fetchStateOptTypeText.OOMKilled':'OOMKilled',
    'global.fetchStateOptTypeText.LivenessProbeFailed':'Health check failed(Restart)',
    'global.fetchStateOptTypeText.ReadinessProbeFailed':'Health check failed(Offline)',
    'global.fetchStateOptTypeText.AbnormalShtdown':'Component exited abnormally',
    'global.fetchStateOptTypeText.AbnormalExited':'Component exited abnormally',
    'global.fetchStateOptTypeText.AbnormalRecovery':'Return to normal',
    'global.fetchStateOptTypeText.create-service':'Create component',
    'global.fetchStateOptTypeText.batch-build-service':'Batch build components',
    'global.fetchStateOptTypeText.batch-start-service':'Batch start components',
    'global.fetchStateOptTypeText.batch-stop-service':'Batch stop components',
    'global.fetchStateOptTypeText.batch-upgrade-service':'Batch upgrade components',
    'global.fetchStateOptTypeText.build-service':'Building component',
    'global.fetchStateOptTypeText.build':'Building component',
    'global.fetchStateOptTypeText.upgrade':'Rolling upgrade',
    'global.fetchStateOptTypeText.update-service':'Update deployment type',
    'global.fetchStateOptTypeText.start-service':'Start component',
    'global.fetchStateOptTypeText.start':'Start component',
    'global.fetchStateOptTypeText.add-app-autoscaler-rule':'Add autoscale rule',
    'global.fetchStateOptTypeText.update-app-autoscaler-rule':'Update autoscale rules',
    'global.fetchStateOptTypeText.stop-service':'Stop component',
    'global.fetchStateOptTypeText.stop':'Stop component',
    'global.fetchStateOptTypeText.restart-service':'Restart component',
    'global.fetchStateOptTypeText.restart':'Restart component',
    'global.fetchStateOptTypeText.vertical-service':'Vertical expansion component',
    'global.fetchStateOptTypeText.vertical':'Vertical expansion component',
    'global.fetchStateOptTypeText.horizontal-service':'Horizontal expansion component',
    'global.fetchStateOptTypeText.horizontal':'Horizontal expansion component',
    'global.fetchStateOptTypeText.stop-tennant':'Stop team',
    'global.fetchStateOptTypeText.set-language':'Set language',
    'global.fetchStateOptTypeText.delete-service':'Delete component',
    'global.fetchStateOptTypeText.upgrade-service':'Upgrade components',
    'global.fetchStateOptTypeText.delete-buildversion':'Delete build version',
    'global.fetchStateOptTypeText.share-service':'Publish component',
    'global.fetchStateOptTypeText.share-wb':'Publish to local',
    'global.fetchStateOptTypeText.share-ws':'Publish to cloud',
    'global.fetchStateOptTypeText.share-yb':'Publish to local',
    'global.fetchStateOptTypeText.share-ys':'Publish to cloud',
    'global.fetchStateOptTypeText.updata':'Update components',
    'global.fetchStateOptTypeText.add-app-service-monitor':'Add monitoring point',
    'global.fetchStateOptTypeText.add-service-dependency':'Add component dependency',
    'global.fetchStateOptTypeText.delete-service-dependency':'Remove component dependency',
    'global.fetchStateOptTypeText.add-service-env':'Add component environment variable',
    'global.fetchStateOptTypeText.update-service-env':'Update component environment variable',
    'global.fetchStateOptTypeText.delete-service-env':'Delete component environment variable',
    'global.fetchStateOptTypeText.add-service-port':'Add component port',
    'global.fetchStateOptTypeText.update-service-port-old':'Update component port',
    'global.fetchStateOptTypeText.update-service-port':'Update component port',
    'global.fetchStateOptTypeText.delete-service-port':'Delete component port',
    'global.fetchStateOptTypeText.handle-service-outerport':'Modify component external port',
    'global.fetchStateOptTypeText.handle-service-innerport':'Modify the internal port of the component',
    'global.fetchStateOptTypeText.change-service-lbport':'Modify component LB port',
    'global.fetchStateOptTypeText.rollback-service':'Rollback',
    'global.fetchStateOptTypeText.add-service-volume':'Add component persistent storage',
    'global.fetchStateOptTypeText.update-service-volume':'Update component persistent storage',
    'global.fetchStateOptTypeText.delete-service-volume':'Delete component persistent storage',
    'global.fetchStateOptTypeText.add-service-depvolume':'Add component dependent storage',
    'global.fetchStateOptTypeText.delete-service-depvolume':'Delete component dependent storage',
    'global.fetchStateOptTypeText.add-service-probe':'Add component probe',
    'global.fetchStateOptTypeText.update-service-probe':'Update component probe',
    'global.fetchStateOptTypeText.delete-service-probe':'Delete component probe',
    'global.fetchStateOptTypeText.add-service-label':'Add component probe',
    'global.fetchStateOptTypeText.update-service-label':'Update component label',
    'global.fetchStateOptTypeText.delete-service-label':'Delete component label',
    'global.fetchStateOptTypeText.add-thirdpart-service':'Add third party components',
    'global.fetchStateOptTypeText.update-thirdpart-service':'Update third party components',
    'global.fetchStateOptTypeText.delete-thirdpart-service':'Delete third-party components',
    'global.fetchStateOptTypeText.update-service-gateway-rule':'Update component gateway rules',
    'global.fetchStateOptTypeText.app-restore-envs':'Reload application environment variables',
    'global.fetchStateOptTypeText.app-restore-ports':'Reload application port',
    'global.fetchStateOptTypeText.app-restore-volumes':'Reload app volume',
    'global.fetchStateOptTypeText.app-restore-probe':'Reload application probe',
    'global.fetchStateOptTypeText.app-restore-deps':'Reload application dependencies',
    'global.fetchStateOptTypeText.app-restore-depvols':'Reload application dependent storage',
    'global.fetchStateOptTypeText.app-restore-plugins':'Reload application plugin',
    'global.fetchStateOptTypeText.create-service-plugin':'Create component plugin',
    'global.fetchStateOptTypeText.update-service-plugin':'Update component plugin',
    'global.fetchStateOptTypeText.delete-service-plugin':'Delete component plugin',
    'global.fetchStateOptTypeText.update-service-plugin-config':'Update component plugin configuration',
    'global.fetchStateOptTypeText.delete-component-k8s-attributes':'Delete k8s attribute',
    'global.fetchStateOptTypeText.update-component-k8s-attributes':'Update k8s attribute',
    'global.fetchStateOptTypeText.create-component-k8s-attributes':'Create k8s attribute',
    'global.fetchStateOptTypeText.Unschedulable':'Unschedulable',
    'global.fetchStateOptTypeText.start':'Waiting to start',
    'global.fetchStateOptTypeText.error':'Abnormal operation',
    'global.fetchStateOptTypeText.up':'Hang up',
    'global.fetchStateOptTypeText.recover':'Recover',
}
export default Object.assign({}, global);